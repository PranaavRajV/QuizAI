from rest_framework import generics, status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserProfileSerializer, UserProfileSerializer as UserSerializer, LoginSerializer
import requests
try:
    from anymail.message import AnymailMessage
except ImportError:
    AnymailMessage = None

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def patch(self, request, *args, **kwargs):
        if 'new_password' in request.data:
            user = self.get_object()
            old_password = request.data.get('password')
            if not user.check_password(old_password):
                return Response({"error": "Wrong current password"}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(request.data.get('new_password'))
            user.save()
            return Response({"status": "Password updated successfully"})
        return super().patch(request, *args, **kwargs)


class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        access_token = request.data.get('token')
        if not access_token:
            return Response({"error": "Access token is required"}, status=status.HTTP_400_BAD_REQUEST)

        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            params={'access_token': access_token}
        )

        if not response.ok:
            return Response({"error": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

        idinfo = response.json()
        email = idinfo.get('email')
        if not email:
            return Response({"error": "Email not found in Google response"}, status=status.HTTP_400_BAD_REQUEST)

        username = idinfo.get('name', email.split('@')[0])
        
        user, created = User.objects.get_or_create(email=email, defaults={
            'username': username,
            'is_active': True
        })

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user, context={'request': request}).data
        })


from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # Using production frontend URL or fallback
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://rajjjquizai.vercel.app')
            reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"
            
            subject = "Reset Your PurpleQuiz AI Password"
            body = f"You requested a password reset for your PurpleQuiz AI account.\n\nClick the link below to set a new password:\n{reset_link}\n\nThis link is valid for 24 hours. If you did not request this, please ignore this email."

            if AnymailMessage and settings.EMAIL_BACKEND == 'anymail.backends.sendgrid.EmailBackend':
                msg = AnymailMessage(
                    subject=subject,
                    body=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[user.email],
                )
                msg.send()
            else:
                send_mail(
                    subject,
                    body,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=True,
                )
            return Response({"status": "Instructions sent."})
        except User.DoesNotExist:
            # We return success to prevent email enumeration
            return Response({"status": "Instructions sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('password')
        
        if not uid or not token or not new_password:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"status": "Password reset successful."})
        else:
            return Response({"error": "Invalid or expired reset token"}, status=status.HTTP_400_BAD_REQUEST)
