import uuid

from django.conf import settings
from django.db import models

from .models import Quiz


def generate_room_code() -> str:
    return uuid.uuid4().hex[:6].upper()


class Room(models.Model):
    STATUS_WAITING = 'waiting'
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'

    STATUS_CHOICES = [
        (STATUS_WAITING, 'Waiting'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='hosted_rooms',
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='rooms')
    room_code = models.CharField(max_length=6, unique=True, default=generate_room_code)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_WAITING)
    max_participants = models.PositiveIntegerField(default=1)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    settings = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Room {self.room_code} for {self.quiz.topic}"


class RoomParticipant(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='room_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0.0)
    rank = models.PositiveIntegerField(null=True, blank=True)
    is_ready = models.BooleanField(default=False)

    class Meta:
        unique_together = ('room', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.room.room_code}"

