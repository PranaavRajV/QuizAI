from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings as django_settings
from .models import Friendship, Challenge, ScoreShare
from .serializers import (
    FriendshipSerializer, ChallengeSerializer, ScoreShareSerializer, SocialUserSerializer
)
from users.models import User
from quizzes.models import Quiz, QuizAttempt, Question, Choice
from notifications.emails import send_friend_request, send_challenge_received, send_weekly_summary
from ai_service.openrouter import OpenRouterService
from ai_service.exceptions import AIServiceException, AllModelsFailedError

class FriendViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(Q(from_user=user) | Q(to_user=user))

    @decorators.action(detail=False, methods=['post'], url_path='request')
    def send_request(self, request):
        to_user_id = request.data.get('to_user_id')
        if not to_user_id:
            return Response({"error": "to_user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        to_user = get_object_or_404(User, id=to_user_id)
        if to_user == request.user:
            return Response({"error": "You cannot friend yourself"}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing
        existing = Friendship.objects.filter(
            Q(from_user=request.user, to_user=to_user) |
            Q(from_user=to_user, to_user=request.user)
        ).first()

        if existing:
            return Response({"error": "Friendship or request already exists"}, status=status.HTTP_400_BAD_REQUEST)

        friendship = Friendship.objects.create(from_user=request.user, to_user=to_user, status='pending')
        send_friend_request(to_user, request.user)
        return Response(FriendshipSerializer(friendship).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        friendship = get_object_or_404(Friendship, id=pk, to_user=request.user, status='pending')
        friendship.status = 'accepted'
        friendship.save()
        return Response({"status": "friendship accepted"})

    @decorators.action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        friendship = get_object_or_404(Friendship, id=pk, to_user=request.user, status='pending')
        friendship.status = 'declined'
        friendship.save()
        return Response({"status": "friendship declined"})
    @decorators.action(detail=False, methods=['post'], url_path='remove')
    def remove_friend(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        friendship = Friendship.objects.filter(
            Q(from_user=request.user, to_user_id=user_id) |
            Q(from_user_id=user_id, to_user=request.user)
        ).first()
        
        if not friendship:
            return Response({"error": "Friendship not found"}, status=status.HTTP_404_NOT_FOUND)
            
        friendship.delete()
        return Response({"status": "friend removed"}, status=status.HTTP_204_NO_CONTENT)

    @decorators.action(detail=False, methods=['get'])
    def list_friends(self, request):
        friends = Friendship.get_friends(request.user)
        # Add basic stats
        friends = friends.annotate(
            avg_score=Avg('attempts__score'),
            total_quizzes=Count('attempts', distinct=True)
        )
        return Response(SocialUserSerializer(friends, many=True).data)

    @decorators.action(detail=False, methods=['get'])
    def requests(self, request):
        incoming = Friendship.objects.filter(to_user=request.user, status='pending')
        return Response(FriendshipSerializer(incoming, many=True).data)

    @decorators.action(detail=False, methods=['get'], url_path='search')
    def user_search(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response([])

        # Get IDs of existing friends and pending requests to exclude
        existing = Friendship.objects.filter(
            Q(from_user=request.user) | Q(to_user=request.user)
        )
        excluded_ids = set()
        for f in existing:
            excluded_ids.add(f.from_user_id)
            excluded_ids.add(f.to_user_id)
        excluded_ids.add(request.user.id)

        results = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id__in=excluded_ids).annotate(
            avg_score=Avg('attempts__score'),
            total_quizzes=Count('attempts', distinct=True)
        )[:10]

        return Response(SocialUserSerializer(results, many=True).data)

    @decorators.action(detail=False, methods=['get'])
    def suggestions(self, request):
        user = request.user
        # Exclude already friends or pending
        existing = Friendship.objects.filter(Q(from_user=user) | Q(to_user=user))
        excluded_ids = {f.from_user_id for f in existing} | {f.to_user_id for f in existing} | {user.id}
        
        # Simple suggestions: users who are not friends or pending yet
        suggestions = User.objects.exclude(id__in=excluded_ids).annotate(
            avg_score=Avg('attempts__score'),
            total_quizzes=Count('attempts', distinct=True)
        ).order_by('-avg_score')[:5]
        
        return Response(SocialUserSerializer(suggestions, many=True).data)

class LeaderboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_leaderboard_data(self, queryset):
        # annotate with stats
        data = queryset.annotate(
            avg_score=Avg('attempts__score'),
            total_quizzes=Count('attempts', distinct=True)
        ).filter(total_quizzes__gte=1).order_by('-avg_score')[:50]
        
        # In a real app, we'd add rank_delta logic here
        return SocialUserSerializer(data, many=True).data

    @decorators.action(detail=False, methods=['get'])
    def global_rank(self, request):
        cache_key = 'leaderboard_global'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        users = User.objects.all()
        data = self._get_leaderboard_data(users)
        cache.set(cache_key, data, timeout=getattr(django_settings, 'LEADERBOARD_CACHE_TIMEOUT', 300))
        return Response(data)

    @decorators.action(detail=False, methods=['get'])
    def weekly(self, request):
        cache_key = 'leaderboard_weekly'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        one_week_ago = timezone.now() - timezone.timedelta(days=7)
        users = User.objects.filter(attempts__completed_at__gte=one_week_ago).distinct()
        data = self._get_leaderboard_data(users)
        cache.set(cache_key, data, timeout=getattr(django_settings, 'LEADERBOARD_CACHE_TIMEOUT', 300))
        return Response(data)

    @decorators.action(detail=False, methods=['get'])
    def friends(self, request):
        friend_ids = [f.id for f in Friendship.get_friends(request.user)] + [request.user.id]
        users = User.objects.filter(id__in=friend_ids)
        return Response(self._get_leaderboard_data(users))

    @decorators.action(detail=False, methods=['get'])
    def me(self, request):
        user = request.user
        # Get rank in global leaderboard
        all_users = User.objects.annotate(
            avg_score=Avg('attempts__score'),
            total_quizzes=Count('attempts', distinct=True)
        ).filter(total_quizzes__gte=1).order_by('-avg_score')
        
        rank = 0
        user_data = None
        for i, u in enumerate(all_users):
            if u.id == user.id:
                rank = i + 1
                user_data = u
                break
        
        if not user_data:
            return Response({"error": "User has no quiz attempts"}, status=status.HTTP_404_NOT_FOUND)

        # Get top 3 subjects
        top_subjects = QuizAttempt.objects.filter(
            user=user, is_completed=True
        ).values('quiz__topic').annotate(
            avg_topic_score=Avg('score')
        ).order_by('-avg_topic_score')[:3]

        return Response({
            "rank": rank,
            "avg_score": round(user_data.avg_score, 1),
            "total_quizzes": user_data.total_quizzes,
            "top_subjects": list(top_subjects)
        })

class ChallengeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChallengeSerializer

    def get_queryset(self):
        user = self.request.user
        return Challenge.objects.filter(Q(challenger=user) | Q(challenged=user)).order_by('-created_at')

    def create(self, request):
        challenged_user_id = request.data.get('challenged_user_id')
        topic = request.data.get('topic')
        difficulty = request.data.get('difficulty', 'medium')
        num_questions = request.data.get('num_questions', 5)

        challenged_user = get_object_or_404(User, id=challenged_user_id)
        
        # 1. Generate AI questions for the challenge quiz
        ai_service = OpenRouterService()
        try:
            questions_data = ai_service.generate_questions(topic, difficulty, num_questions, user_id=request.user.id)
            
            # 2. Create the Quiz object
            quiz = Quiz.objects.create(
                topic=topic,
                difficulty=difficulty,
                num_questions=len(questions_data),
                created_by=request.user
            )
            
            # 3. Save questions and choices
            for q_data in questions_data:
                question = Question.objects.create(
                    quiz=quiz,
                    question_text=q_data['question_text'],
                    explanation=q_data['explanation']
                )
                for idx, choice_text in enumerate(q_data['choices']):
                    Choice.objects.create(
                        question=question,
                        choice_text=choice_text,
                        is_correct=(idx == q_data['correct_index'])
                    )
            
            # 4. Create the Challenge
            challenge = Challenge.objects.create(
                challenger=request.user,
                challenged=challenged_user,
                quiz=quiz,
                status='pending'
            )
            send_challenge_received(challenged_user, request.user, topic)
            return Response(ChallengeSerializer(challenge).data, status=status.HTTP_201_CREATED)
            
        except (AIServiceException, AllModelsFailedError) as e:
            return Response(
                {"error": "Social Arena: AI generators are busy. Please try again in 30 seconds.", "code": "ai_busy"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

    @decorators.action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        challenge = get_object_or_404(Challenge, id=pk, challenged=request.user, status='pending')
        challenge.status = 'active'
        challenge.save()
        return Response({"status": "challenge accepted", "quiz_id": challenge.quiz.id})

class ShareViewSet(viewsets.ViewSet):
    def get_permissions(self):
        if self.action == 'public_get':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @decorators.action(detail=False, methods=['post'])
    def create_share(self, request):
        attempt_id = request.data.get('attempt_id')
        is_public = request.data.get('is_public', False)
        
        attempt = get_object_or_404(QuizAttempt, id=attempt_id, user=request.user)
        share, created = ScoreShare.objects.get_or_create(
            user=request.user,
            attempt=attempt,
            defaults={'is_public': is_public}
        )
        return Response(ScoreShareSerializer(share).data)

    @decorators.action(detail=True, methods=['get'], url_path='public/(?P<token>[^/.]+)', url_name='public_get')
    def public_get(self, request, token=None):
        # We need to manually handle the token since detail=True expects pk
        share = get_object_or_404(ScoreShare, share_token=token)
        return Response(ScoreShareSerializer(share).data)

class NotificationsView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        
        # Pending friend requests
        friend_requests = Friendship.objects.filter(to_user=user, status='pending')
        
        # Pending challenges
        challenges = Challenge.objects.filter(challenged=user, status='pending')
        
        # We need a way to return these that doesn't trigger complex nested serialization issues
        # if the fields like avg_score aren't annotated.
        
        return Response({
            "friend_requests": [
                {
                    "id": fr.id,
                    "from_user": {
                        "username": fr.from_user.username,
                        "id": fr.from_user.id
                    },
                    "created_at": fr.created_at
                } for fr in friend_requests
            ],
            "challenges": [
                {
                    "id": c.id,
                    "challenger": {
                        "username": c.challenger.username,
                        "id": c.challenger.id
                    },
                    "quiz": {
                        "topic": c.quiz.topic,
                        "id": c.quiz.id
                    },
                    "created_at": c.created_at
                } for c in challenges
            ],
            "total_count": friend_requests.count() + challenges.count()
        })
