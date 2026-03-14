from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Friendship, Challenge, ScoreShare
from quizzes.serializers import QuizSerializer, QuizAttemptSerializer

User = get_user_model()

class SocialUserSerializer(serializers.ModelSerializer):
    avatar_initials = serializers.SerializerMethodField()
    avg_score = serializers.FloatField(read_only=True)
    total_quizzes = serializers.IntegerField(read_only=True)
    is_online = serializers.SerializerMethodField()
    last_active = serializers.DateTimeField(source='last_login', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'avatar_initials', 'avg_score', 'total_quizzes', 'last_active', 'is_online')

    def get_avatar_initials(self, obj):
        return obj.username[:2].upper()

    def get_is_online(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        if obj.last_login:
            return obj.last_login > timezone.now() - timedelta(minutes=5)
        return False

class FriendshipSerializer(serializers.ModelSerializer):
    from_user_detail = SocialUserSerializer(source='from_user', read_only=True)
    to_user_detail = SocialUserSerializer(source='to_user', read_only=True)

    class Meta:
        model = Friendship
        fields = ('id', 'from_user', 'to_user', 'from_user_detail', 'to_user_detail', 'status', 'created_at', 'updated_at')
        read_only_fields = ('status', 'from_user')

class ChallengeSerializer(serializers.ModelSerializer):
    challenger_detail = SocialUserSerializer(source='challenger', read_only=True)
    challenged_detail = SocialUserSerializer(source='challenged', read_only=True)
    quiz_detail = QuizSerializer(source='quiz', read_only=True)
    challenger_attempt_detail = QuizAttemptSerializer(source='challenger_attempt', read_only=True)
    challenged_attempt_detail = QuizAttemptSerializer(source='challenged_attempt', read_only=True)
    winner_name = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = (
            'id', 'challenger', 'challenged', 'challenger_detail', 'challenged_detail',
            'quiz', 'quiz_detail', 'challenger_attempt', 'challenged_attempt',
            'challenger_attempt_detail', 'challenged_attempt_detail',
            'status', 'created_at', 'expires_at', 'winner_name'
        )

    def get_winner_name(self, obj):
        winner = obj.winner
        return winner.username if winner else None

class ScoreShareSerializer(serializers.ModelSerializer):
    quiz_name = serializers.CharField(source='attempt.quiz.topic', read_only=True)
    score = serializers.FloatField(source='attempt.score', read_only=True)
    correct_count = serializers.IntegerField(source='attempt.correct_count', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ScoreShare
        fields = ('id', 'user', 'username', 'attempt', 'share_token', 'is_public', 'created_at', 'quiz_name', 'score', 'correct_count')
        read_only_fields = ('user', 'share_token')
