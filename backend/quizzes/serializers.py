from rest_framework import serializers
from .models import Quiz, Question, Choice, QuizAttempt, UserAnswer

class ChoiceSerializer(serializers.ModelSerializer):
    """Used during active quiz — never exposes correct answer."""
    class Meta:
        model = Choice
        fields = ('id', 'choice_text')  # is_correct intentionally omitted


class ChoiceWithAnswerSerializer(serializers.ModelSerializer):
    """Used only in results view, after quiz is completed."""
    class Meta:
        model = Choice
        fields = ('id', 'choice_text', 'is_correct')

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'question_text', 'explanation', 'order', 'type', 'choices')

class QuestionWithAnswerSerializer(serializers.ModelSerializer):
    choices = ChoiceWithAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'question_text', 'explanation', 'order', 'type', 'correct_answer', 'choices')

from django.utils.html import strip_tags

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    quiz_config = serializers.JSONField(required=False)

    class Meta:
        model = Quiz
        fields = (
            'id',
            'share_token',
            'topic',
            'difficulty',
            'num_questions',
            'created_by',
            'created_by_name',
            'created_at',
            'questions',
            'quiz_config',
            'is_public',
            'public_attempt_count',
            'public_avg_score',
        )
        read_only_fields = ('created_by', 'share_token', 'is_public', 'public_attempt_count', 'public_avg_score')

    def validate_topic(self, value):
        sanitized = strip_tags(value).strip()
        if not sanitized:
            raise serializers.ValidationError("Topic cannot be empty or just HTML.")
        if len(sanitized) > 100:
            raise serializers.ValidationError("Topic must be under 100 characters.")
        return sanitized

    def validate_num_questions(self, value):
        if not (5 <= value <= 20):
            raise serializers.ValidationError("Number of questions must be between 5 and 20.")
        return value

class QuizListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Quiz
        fields = ('id', 'share_token', 'topic', 'difficulty', 'num_questions', 'created_by_name', 'created_at')

class UserAnswerSerializer(serializers.ModelSerializer):
    selected_choice_detail = ChoiceWithAnswerSerializer(source='selected_choice', read_only=True)

    class Meta:
        model = UserAnswer
        fields = (
            'id',
            'question',
            'selected_choice',
            'selected_choice_detail',
            'is_correct',
            'typed_answer',
            'feedback',
        )

class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_topic = serializers.ReadOnlyField(source='quiz.topic')
    
    class Meta:
        model = QuizAttempt
        fields = (
            'id',
            'user',
            'quiz',
            'quiz_topic',
            'score',
            'total_questions',
            'correct_count',
            'started_at',
            'completed_at',
            'is_completed',
            'evaluation_status',
        )
        read_only_fields = ('user', 'score', 'correct_count', 'is_completed', 'evaluation_status')

class QuizAttemptResultSerializer(serializers.ModelSerializer):
    quiz_topic = serializers.ReadOnlyField(source='quiz.topic')
    quiz_details = QuestionWithAnswerSerializer(source='quiz.questions', many=True, read_only=True)
    answers = UserAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = (
            'id',
            'quiz_topic',
            'quiz_details',
            'score',
            'total_questions',
            'correct_count',
            'started_at',
            'completed_at',
            'is_completed',
            'evaluation_status',
            'answers',
        )

class PublicQuizSerializer(serializers.ModelSerializer):
    """Specific for public sharing — absolutely no correct answers or explanations."""
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Quiz
        fields = (
            'id', 'topic', 'difficulty', 'num_questions', 
            'created_by_name', 'created_at', 'questions'
        )

from .models import Room, RoomParticipant

class RoomParticipantSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    avatar_url = serializers.ReadOnlyField(source='user.avatar_url')

    class Meta:
        model = RoomParticipant
        fields = ('id', 'user', 'username', 'avatar_url', 'is_ready', 'score', 'rank')

class RoomSerializer(serializers.ModelSerializer):
    host_name = serializers.ReadOnlyField(source='host.username')
    quiz_topic = serializers.ReadOnlyField(source='quiz.topic')
    participants = RoomParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = (
            'id', 'room_code', 'host', 'host_name', 'quiz', 'quiz_topic', 
            'status', 'max_participants', 'participants', 'created_at', 
            'started_at', 'completed_at'
        )

