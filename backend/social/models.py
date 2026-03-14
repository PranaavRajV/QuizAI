from django.db import models
from django.conf import settings
from django.db.models import Q
import uuid
from quizzes.models import Quiz, QuizAttempt

class Friendship(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    )

    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='friendship_requests_sent', on_delete=models.CASCADE)
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='friendship_requests_received', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"

    @staticmethod
    def are_friends(u1, u2):
        return Friendship.objects.filter(
            Q(from_user=u1, to_user=u2, status='accepted') |
            Q(from_user=u2, to_user=u1, status='accepted')
        ).exists()

    @staticmethod
    def get_friends(user):
        friendships = Friendship.objects.filter(
            Q(from_user=user, status='accepted') |
            Q(to_user=user, status='accepted')
        )
        friend_ids = []
        for f in friendships:
            if f.from_user == user:
                friend_ids.append(f.to_user.id)
            else:
                friend_ids.append(f.from_user.id)
        from users.models import User
        return User.objects.filter(id__in=friend_ids)

class Challenge(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    )

    challenger = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='challenges_sent', on_delete=models.CASCADE)
    challenged = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='challenges_received', on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    challenger_attempt = models.ForeignKey(QuizAttempt, related_name='challenge_challenger_attempts', on_delete=models.SET_NULL, null=True, blank=True)
    challenged_attempt = models.ForeignKey(QuizAttempt, related_name='challenge_challenged_attempts', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def winner(self):
        if self.status != 'completed' or not self.challenger_attempt or not self.challenged_attempt:
            return None
        if self.challenger_attempt.score > self.challenged_attempt.score:
            return self.challenger
        elif self.challenged_attempt.score > self.challenger_attempt.score:
            return self.challenged
        return None  # Tie

class ScoreShare(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Share by {self.user.username} for attempt {self.attempt.id}"
