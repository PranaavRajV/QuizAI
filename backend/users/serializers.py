from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)
    notifications_unread = serializers.SerializerMethodField(read_only=True)
    pending_friend_requests_count = serializers.SerializerMethodField(read_only=True)
    pending_challenges_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'bio', 'email_notifications', 'push_notifications', 'dark_mode', 'avatar', 'avatar_url', 'notifications_unread', 'pending_friend_requests_count', 'pending_challenges_count')
        extra_kwargs = {
            'avatar': {'write_only': True, 'required': False, 'allow_null': True},
        }

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

    def get_notifications_unread(self, obj):
        return obj.notifications.filter(is_read=False).count()

    def get_pending_friend_requests_count(self, obj):
        from social.models import Friendship
        return Friendship.objects.filter(to_user=obj, status='pending').count()

    def get_pending_challenges_count(self, obj):
        from social.models import Challenge
        return Challenge.objects.filter(challenged=obj, status='pending').count()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'bio')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            bio=validated_data.get('bio', '')
        )
        return user


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user, context={'request': self.context.get('request')}).data
        return data
