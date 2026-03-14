from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from datetime import timedelta
from .models import Quiz, Question, Choice, QuizAttempt, UserAnswer
from .serializers import (
    QuizSerializer, QuizListSerializer, QuizAttemptSerializer, 
    QuizAttemptResultSerializer, UserAnswerSerializer
)
from ai_service.openrouter import OpenRouterService
from ai_service.exceptions import AIServiceException, AllModelsFailedError

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from django.utils.decorators import method_decorator

class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = {
        'difficulty': ['exact'],
        'created_at': ['gte', 'lte'],
    }
    ordering_fields = ['created_at', 'topic']
    ordering = ['-created_at']
    search_fields = ['topic']
    
    def get_queryset(self):
        return Quiz.objects.filter(
            is_active=True
        ).select_related('created_by').prefetch_related(
            'questions', 'questions__choices'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return QuizListSerializer
        return QuizSerializer

    def create(self, request, *args, **kwargs):
        # Use serializer for input validation and sanitization
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        topic = serializer.validated_data['topic']
        difficulty = serializer.validated_data.get('difficulty', 'medium')
        num_questions = serializer.validated_data.get('num_questions', 5)

        ai_service = OpenRouterService()
        try:
            questions_data = ai_service.generate_questions(topic, difficulty, num_questions, user_id=request.user.id)
            
            quiz = Quiz.objects.create(
                topic=topic,
                difficulty=difficulty,
                num_questions=len(questions_data),
                created_by=request.user
            )

            for idx, q_data in enumerate(questions_data):
                question = Question.objects.create(
                    quiz=quiz,
                    question_text=q_data['question_text'],
                    explanation=q_data.get('explanation', ''),
                    order=idx
                )
                
                for c_idx, c_text in enumerate(q_data['choices']):
                    Choice.objects.create(
                        question=question,
                        choice_text=c_text,
                        is_correct=(c_idx == q_data['correct_index'])
                    )

            # Return the full quiz using the serializer
            return Response(self.get_serializer(quiz).data, status=status.HTTP_201_CREATED)

        except AllModelsFailedError as e:
            return Response({
                "error": "Quiz generation temporarily unavailable",
                "detail": "All AI models are currently unavailable. Please try again later.",
                "code": "ALL_MODELS_FAILED"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except AIServiceException as e:
            return Response({"error": "AI service temporarily unavailable, please try again"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='share/(?P<share_token>[0-9a-f-]+)', permission_classes=[permissions.AllowAny])
    def share(self, request, share_token=None):
        quiz = get_object_or_404(Quiz, share_token=share_token, is_active=True)
        serializer = self.get_serializer(quiz)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def start(self, request, pk=None):
        quiz = self.get_object()
        user = request.user if request.user.is_authenticated else None
        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            total_questions=quiz.questions.count()
        )
        return Response({"attempt_id": attempt.id}, status=status.HTTP_201_CREATED)

class AttemptViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = QuizAttempt.objects.all()

    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        attempt = self.get_object()
        if attempt.is_completed:
            return Response({"error": "Attempt already completed"}, status=status.HTTP_400_BAD_REQUEST)
        
        if attempt.user and attempt.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        question_id = request.data.get('question_id')
        choice_id = request.data.get('choice_id')

        question = get_object_or_404(Question, id=question_id, quiz=attempt.quiz)
        selected_choice = get_object_or_404(Choice, id=choice_id, question=question)

        user_answer, created = UserAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults={
                'selected_choice': selected_choice,
                'is_correct': selected_choice.is_correct
            }
        )

        return Response({"is_correct": user_answer.is_correct}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        attempt = self.get_object()
        if attempt.is_completed:
            return Response({"error": "Attempt already completed"}, status=status.HTTP_400_BAD_REQUEST)

        answers = UserAnswer.objects.filter(attempt=attempt)
        correct_count = answers.filter(is_correct=True).count()
        
        attempt.correct_count = correct_count
        attempt.score = (correct_count / attempt.total_questions) * 100 if attempt.total_questions > 0 else 0
        attempt.completed_at = timezone.now()
        attempt.is_completed = True
        attempt.save()

        # Check challenges — wrapped so any error here never blocks completion
        try:
            from social.models import Challenge
            from notifications.emails import send_challenge_completed

            challenges = Challenge.objects.filter(quiz=attempt.quiz, status__in=['pending', 'active'])
            for challenge in challenges:
                updated = False
                if challenge.challenger == request.user:
                    challenge.challenger_attempt = attempt
                    updated = True
                elif challenge.challenged == request.user:
                    challenge.challenged_attempt = attempt
                    updated = True

                if updated:
                    challenge.save()

                if challenge.challenger_attempt and challenge.challenged_attempt and challenge.status != 'completed':
                    challenge.status = 'completed'
                    challenge.save()

                    winner = challenge.winner

                    try:
                        # Notify challenger
                        send_challenge_completed(
                            user=challenge.challenger,
                            opponent=challenge.challenged,
                            your_score=challenge.challenger_attempt.score,
                            their_score=challenge.challenged_attempt.score,
                            won=(winner == challenge.challenger)
                        )
                        # Notify challenged
                        send_challenge_completed(
                            user=challenge.challenged,
                            opponent=challenge.challenger,
                            your_score=challenge.challenged_attempt.score,
                            their_score=challenge.challenger_attempt.score,
                            won=(winner == challenge.challenged)
                        )
                    except Exception as email_err:
                        import logging
                        logging.getLogger(__name__).warning(
                            f"Challenge email notification failed (non-fatal): {email_err}"
                        )
        except Exception as challenge_err:
            import logging
            logging.getLogger(__name__).warning(
                f"Challenge post-processing failed (non-fatal): {challenge_err}"
            )


        return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        attempt = self.get_object()
        if not attempt.is_completed:
            return Response({"error": "Attempt not yet completed"}, status=status.HTTP_400_BAD_REQUEST)
        
        if attempt.user and attempt.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = QuizAttemptResultSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_200_OK)

class HistoryView(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizAttemptSerializer

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            user=self.request.user
        ).select_related('quiz', 'user').order_by('-started_at')

class AnalyticsView(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_analytics(self, request):
        user = request.user
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        attempts = QuizAttempt.objects.filter(
            user=user,
            is_completed=True,
            completed_at__gte=thirty_days_ago
        ).select_related('quiz').order_by('completed_at')
        
        scores_over_time = []
        for attempt in attempts:
            scores_over_time.append({
                "date": attempt.completed_at.strftime("%Y-%m-%d"),
                "score": round(attempt.score, 1)
            })

        diff_stats = QuizAttempt.objects.filter(
            user=user,
            is_completed=True
        ).values('quiz__difficulty').annotate(avg_score=Avg('score'))
        
        perf_by_diff = {
            "easy": 0,
            "medium": 0,
            "hard": 0
        }
        for stat in diff_stats:
            perf_by_diff[stat['quiz__difficulty']] = round(stat['avg_score'], 1)

        topic_stats = QuizAttempt.objects.filter(
            user=user,
            is_completed=True
        ).values('quiz__topic').annotate(
            attempts_count=Count('id'),
            avg_score=Avg('score')
        ).order_by('-avg_score')

        top_topics = []
        for stat in topic_stats:
            top_topics.append({
                "topic": stat['quiz__topic'],
                "attempts": stat['attempts_count'],
                "avg_score": round(stat['avg_score'], 1)
            })

        # Calculate success rate (score >= 70)
        total_quizzes = len(attempts)
        successful_quizzes = sum(1 for a in attempts if a.score >= 70)
        success_rate = round((successful_quizzes / total_quizzes * 100), 1) if total_quizzes > 0 else 0

        # Calculate trend (avg of last 3 vs avg of previous 7)
        last_3 = attempts[max(0, total_quizzes-3):]
        prev_7 = attempts[max(0, total_quizzes-10):max(0, total_quizzes-3)]
        
        avg_last_3 = sum(a.score for a in last_3) / len(last_3) if last_3 else 0
        avg_prev_7 = sum(a.score for a in prev_7) / len(prev_7) if prev_7 else 0
        trend = round(avg_last_3 - avg_prev_7, 1)

        return Response({
            "scores_over_time": scores_over_time,
            "performance_by_difficulty": perf_by_diff,
            "topics": top_topics,
            "success_rate": success_rate,
            "trend": trend,
            "total_quizzes": total_quizzes
        })
