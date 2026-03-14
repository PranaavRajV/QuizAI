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
        fields = ('id', 'question_text', 'explanation', 'order', 'choices')

from django.utils.html import strip_tags

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Quiz
        fields = ('id', 'share_token', 'topic', 'difficulty', 'num_questions', 'created_by', 'created_by_name', 'created_at', 'questions')
        read_only_fields = ('created_by', 'share_token')

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
        fields = ('id', 'question', 'selected_choice', 'selected_choice_detail', 'is_correct')

class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_topic = serializers.ReadOnlyField(source='quiz.topic')
    
    class Meta:
        model = QuizAttempt
        fields = ('id', 'user', 'quiz', 'quiz_topic', 'score', 'total_questions', 'correct_count', 'started_at', 'completed_at', 'is_completed')
        read_only_fields = ('user', 'score', 'correct_count', 'is_completed')

class QuizAttemptResultSerializer(serializers.ModelSerializer):
    quiz_topic = serializers.ReadOnlyField(source='quiz.topic')
    answers = UserAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ('id', 'quiz_topic', 'score', 'total_questions', 'correct_count', 'started_at', 'completed_at', 'is_completed', 'answers')

