import uuid
from django.db import models
from django.conf import settings

class Quiz(models.Model):
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, null=True)
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    topic = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    num_questions = models.PositiveIntegerField(default=10)
    # Stores full quiz configuration used at generation time
    # e.g. topic, num_questions, difficulty, max_participants, time_per_question, points_per_question, question_types
    quiz_config = models.JSONField(default=dict, blank=True)

    # Public sharing / analytics
    is_public = models.BooleanField(default=False)
    public_attempt_count = models.PositiveIntegerField(default=0)
    public_avg_score = models.FloatField(default=0.0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quizzes')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Quizzes"
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['topic']),
        ]

    def __str__(self):
        return f"{self.topic} ({self.difficulty})"

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    explanation = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    QUESTION_TYPE_CHOICES = [
        ('mcq', 'Multiple Choice'),
        ('typed', 'Typed Answer'),
    ]
    type = models.CharField(max_length=10, choices=QUESTION_TYPE_CHOICES, default='mcq')
    # For typed questions only
    correct_answer = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['quiz']),
        ]

    def __str__(self):
        return f"Q: {self.question_text[:50]}..."

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['question']),
        ]

    def __str__(self):
        return self.choice_text

class QuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attempts', null=True, blank=True)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.FloatField(default=0.0)
    total_questions = models.PositiveIntegerField()
    correct_count = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    # Tracks async evaluation lifecycle for typed answers
    EVALUATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
    ]
    evaluation_status = models.CharField(
        max_length=16,
        choices=EVALUATION_STATUS_CHOICES,
        default='pending',
    )

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['quiz']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.quiz.topic} - {self.score}%"

class UserAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    # For typed questions
    typed_answer = models.TextField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['attempt']),
            models.Index(fields=['question']),
        ]

    def __str__(self):
        username = self.attempt.user.username if self.attempt.user else "anonymous"
        return f"Ans: {username} - {self.question.id}"

class Room(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hosted_rooms')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    room_code = models.CharField(max_length=6, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='waiting')
    max_participants = models.PositiveIntegerField(default=10)
    quiz_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Room {self.room_code} - {self.status}"

class RoomParticipant(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0.0)
    rank = models.PositiveIntegerField(null=True, blank=True)
    is_ready = models.BooleanField(default=False)

    class Meta:
        unique_together = ('room', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.room.room_code}"
