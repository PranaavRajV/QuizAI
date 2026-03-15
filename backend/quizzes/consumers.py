import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, RoomParticipant, Quiz, Question, Choice
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class QuizRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'quiz_room_{self.room_code}'
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Check if room exists
        self.room = await self.get_room(self.room_code)
        if not self.room:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Notify others
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user': self.user.username,
                'avatar': self.user.avatar_url if hasattr(self.user, 'avatar_url') else None
            }
        )
        
        # Send initial state
        await self.send_room_info()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'ready':
            await self.set_ready(data.get('is_ready', True))
            await self.send_room_info()
        
        elif action == 'start_quiz':
            if await self.is_host():
                await self.start_quiz()
        
        elif action == 'submit_answer':
            await self.handle_answer(
                data.get('question_id'), 
                data.get('choice_id'), 
                data.get('typed_answer'),
                time_taken=data.get('time_taken')
            )
            await self.send_room_info()

    async def send_room_info(self):
        info = await self.get_room_data()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'room_update',
                'data': info
            }
        )

    async def room_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'room_update',
            'data': event['data']
        }))

    async def user_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user'],
            'avatar': event['avatar']
        }))

    async def start_quiz(self):
        await self.update_room_status('active')
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'quiz_started'
            }
        )

    async def quiz_started(self, event):
        await self.send(text_data=json.dumps({
            'type': 'quiz_started'
        }))

    # DB Helper methods
    @database_sync_to_async
    def get_room(self, code):
        try:
            return Room.objects.get(room_code=code)
        except Room.DoesNotExist:
            return None

    @database_sync_to_async
    def get_room_data(self):
        room = Room.objects.get(room_code=self.room_code)
        participants = RoomParticipant.objects.filter(room=room).select_related('user')
        return {
            'code': room.room_code,
            'status': room.status,
            'topic': room.quiz.topic,
            'host_id': room.host.id,
            'participants': [
                {
                    'username': p.user.username,
                    'is_ready': p.is_ready,
                    'score': p.score,
                    'is_host': p.user == room.host
                } for p in participants
            ]
        }

    @database_sync_to_async
    def set_ready(self, is_ready):
        participant = RoomParticipant.objects.get(room__room_code=self.room_code, user=self.user)
        participant.is_ready = is_ready
        participant.save()

    @database_sync_to_async
    def is_host(self):
        return Room.objects.filter(room_code=self.room_code, host=self.user).exists()

    @database_sync_to_async
    def update_room_status(self, status):
        room = Room.objects.get(room_code=self.room_code)
        room.status = status
        if status == 'active':
            room.started_at = timezone.now()
        room.save()

    @database_sync_to_async
    def handle_answer(self, q_id, c_id, typed, time_taken=None):
        try:
            room = Room.objects.get(room_code=self.room_code)
            participant = RoomParticipant.objects.get(room=room, user=self.user)
            question = Question.objects.get(id=q_id, quiz=room.quiz)
            
            is_correct = False
            if question.type == 'mcq' and c_id:
                choice = Choice.objects.get(id=c_id, question=question)
                is_correct = choice.is_correct
            elif question.type == 'typed' and typed:
                is_correct = typed.strip().lower() == (question.correct_answer or "").strip().lower()

            if is_correct:
                base_points = room.quiz_config.get('points_per_question', 100)
                time_bonus = 0
                max_time = room.quiz_config.get('time_per_question', 30)
                
                if time_taken is not None and max_time > 0:
                    # Speed bonus: up to 50% more points if fast
                    multiplier = max(0, (max_time - time_taken) / max_time)
                    time_bonus = int(base_points * 0.5 * multiplier)
                
                participant.score += (base_points + time_bonus)
                participant.save()
            
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error handling answer: {e}")
