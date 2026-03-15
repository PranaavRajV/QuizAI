from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from datetime import timedelta
from .models import Quiz, Question, Choice, QuizAttempt, UserAnswer, Room, RoomParticipant
from .tasks import evaluate_typed_answers
from .serializers import (
    QuizSerializer, QuizListSerializer, QuizAttemptSerializer, 
    QuizAttemptResultSerializer, UserAnswerSerializer,
    RoomSerializer, RoomParticipantSerializer
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
        user = self.request.user
        if not user or not user.is_authenticated:
            # For unauthenticated users, only show public quizzes
            return Quiz.objects.filter(is_public=True, is_active=True).select_related('created_by').prefetch_related('questions', 'questions__choices')
            
        # For authenticated users:
        # 1. In list view (My Quizzes), only show owned quizzes
        # 2. In detail view, allow owned OR public quizzes
        if self.action == 'list':
            return Quiz.objects.filter(
                created_by=user,
                is_active=True
            ).select_related('created_by').prefetch_related(
                'questions', 'questions__choices'
            )
            
        from django.db.models import Q
        return Quiz.objects.filter(
            Q(created_by=user) | Q(is_public=True),
            is_active=True
        ).select_related('created_by').prefetch_related(
            'questions', 'questions__choices'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return QuizListSerializer
        return QuizSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Use serializer for input validation and sanitization
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Support both legacy flat fields and new settings JSON
        settings_payload = request.data.get('quiz_config') or request.data.get('settings') or {}

        topic = settings_payload.get('topic') or serializer.validated_data['topic']
        difficulty = settings_payload.get('difficulty') or serializer.validated_data.get('difficulty', 'medium')
        num_questions = settings_payload.get('num_questions') or serializer.validated_data.get('num_questions', 5)

        # Normalized settings we persist on the Quiz
        quiz_settings = {
            "topic": topic,
            "difficulty": difficulty,
            "num_questions": num_questions,
            "max_participants": settings_payload.get('max_participants'),
            "time_per_question": settings_payload.get('time_per_question'),
            "points_per_question": settings_payload.get('points_per_question'),
            "question_types": settings_payload.get('question_types'),
        }

        ai_service = OpenRouterService()
        try:
            questions_data = ai_service.generate_questions(
                topic=topic,
                difficulty=difficulty,
                num_questions=num_questions,
                user_id=request.user.id,
                settings=quiz_settings,
            )

            quiz = Quiz.objects.create(
                topic=topic,
                difficulty=difficulty,
                num_questions=len(questions_data),
                created_by=request.user,
                quiz_config=quiz_settings,
            )

            for idx, q_data in enumerate(questions_data):
                question_type = q_data.get('type', 'mcq')
                question = Question.objects.create(
                    quiz=quiz,
                    question_text=q_data['question_text'],
                    explanation=q_data.get('explanation', ''),
                    order=idx,
                    type=question_type,
                    correct_answer=q_data.get('correct_answer') if question_type == 'typed' else None,
                )

                # MCQ choices only for mcq questions
                for c_idx, c_text in enumerate(q_data.get('choices', [])):
                    Choice.objects.create(
                        question=question,
                        choice_text=c_text,
                        is_correct=(c_idx == q_data.get('correct_index')),
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
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='share', permission_classes=[permissions.IsAuthenticated])
    def make_public(self, request, pk=None):
        """
        Generate a public share link for this quiz.
        """
        quiz = self.get_object()
        if quiz.created_by != request.user:
            return Response({"error": "Only the owner can share this quiz."}, status=status.HTTP_403_FORBIDDEN)

        quiz.is_public = True
        if not quiz.share_token:
            # share_token default covers this, but ensure it's set
            import uuid
            quiz.share_token = uuid.uuid4()
        quiz.save(update_fields=['is_public', 'share_token'])

        share_token = str(quiz.share_token)
        return Response(
            {
                "share_token": share_token,
                "share_url": f"/quiz/play/{share_token}",
            },
            status=status.HTTP_200_OK,
        )

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
        typed_answer = request.data.get('typed_answer')

        try:
            question = Question.objects.get(id=question_id, quiz=attempt.quiz)
        except Question.DoesNotExist:
            return Response({"error": f"Question {question_id} not found in this quiz"}, status=status.HTTP_404_NOT_FOUND)

        defaults = {}
        if question.type == 'mcq':
            try:
                selected_choice = Choice.objects.get(id=choice_id, question=question)
            except Choice.DoesNotExist:
                return Response({"error": f"Choice {choice_id} not found for this question"}, status=status.HTTP_404_NOT_FOUND)
            defaults['selected_choice'] = selected_choice
            defaults['is_correct'] = selected_choice.is_correct
            defaults['typed_answer'] = None
        else:
            # typed question - store raw answer, evaluation happens async
            defaults['typed_answer'] = typed_answer
            defaults['selected_choice'] = None
            defaults['is_correct'] = False

        user_answer, created = UserAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults=defaults,
        )

        if question.type == 'typed':
            return Response({"status": "evaluating", "is_correct": False}, status=status.HTTP_200_OK)
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
        # If there are typed questions, kick off async evaluation
        has_typed = UserAnswer.objects.filter(attempt=attempt, question__type='typed').exists()
        if has_typed:
            attempt.evaluation_status = 'processing'
        else:
            attempt.evaluation_status = 'completed'
        attempt.save()

        if has_typed:
            try:
                evaluate_typed_answers.delay(attempt.id)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(
                    f"Failed to enqueue typed evaluation task (non-fatal): {e}"
                )

        # Update Quiz Public Analytics if this was an anonymous/public attempt
        if not attempt.user or attempt.quiz.is_public:
            quiz = attempt.quiz
            # atomicity is handled by @transaction.atomic if we had it, 
            # but we can use F expressions or just save.
            quiz.public_attempt_count += 1
            # Simple running average
            total_score = (quiz.public_avg_score * (quiz.public_attempt_count - 1)) + attempt.score
            quiz.public_avg_score = total_score / quiz.public_attempt_count
            quiz.save(update_fields=['public_attempt_count', 'public_avg_score'])

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

class PublicPlayViewSet(viewsets.GenericViewSet):
    """
    Handle public (unauthenticated) quiz attempts using share_token.
    """
    permission_classes = [permissions.AllowAny]
    queryset = Quiz.objects.filter(is_public=True)
    lookup_field = 'share_token'

    def retrieve(self, request, share_token=None):
        quiz = get_object_or_404(Quiz, share_token=share_token, is_public=True)
        # Use a specialized serializer that hides correct answers
        from .serializers import PublicQuizSerializer
        return Response(PublicQuizSerializer(quiz).data)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, share_token=None):
        quiz = get_object_or_404(Quiz, share_token=share_token, is_public=True)
        # For public submission, we assume the frontend might have sent 
        # an attempt_id from the start endpoint.
        attempt_id = request.data.get('attempt_id')
        attempt = get_object_or_404(QuizAttempt, id=attempt_id, quiz=quiz)
        
        # Complete the attempt using existing logic
        return AttemptViewSet().complete(request, pk=attempt.id)

class RoomViewSet(viewsets.ModelViewSet):
    """
    Multiplayer Room management.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Room.objects.all()
    lookup_field = 'room_code'

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return RoomSerializer
        return RoomSerializer # Fallback

    def create(self, request, *args, **kwargs):
        quiz_id = request.data.get('quiz_id')
        quiz = get_object_or_404(Quiz, id=quiz_id)
        
        import string, random
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        room = Room.objects.create(
            host=request.user,
            quiz=quiz,
            room_code=code,
            max_participants=quiz.quiz_config.get('max_participants', 10),
            quiz_config=quiz.quiz_config,
        )
        # Host joins automatically
        from .models import RoomParticipant
        RoomParticipant.objects.create(room=room, user=request.user, is_ready=True)
        
        return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='join')
    def join_room(self, request):
        code = request.data.get('room_code')
        room = get_object_or_404(Room, room_code=code, status='waiting')
        
        if room.participants.count() >= room.max_participants:
            return Response({"error": "Room is full"}, status=status.HTTP_400_BAD_REQUEST)
            
        from .models import RoomParticipant
        participant, created = RoomParticipant.objects.get_or_create(
            room=room,
            user=request.user
        )
        
        return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def start(self, request, room_code=None):
        room = self.get_object()
        if room.host != request.user:
            return Response({"error": "Only host can start"}, status=status.HTTP_403_FORBIDDEN)
        
        if room.participants.filter(is_ready=True).count() < 2:
            return Response({"error": "Need at least 2 ready players"}, status=status.HTTP_400_BAD_REQUEST)
            
        room.status = 'active'
        room.started_at = timezone.now()
        room.save()
        
        # In a real app, this would trigger a WebSocket event.
        # We'll rely on the consumer logic for that.
        
        return Response({"status": "Room started"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def results(self, request, room_code=None):
        room = self.get_object()
        if room.status != 'completed':
            return Response({"error": "Quiz not finished"}, status=status.HTTP_400_BAD_REQUEST)
            
        participants = room.participants.all().order_by('-score')
        return Response(RoomParticipantSerializer(participants, many=True).data)
