from rest_framework import generics, status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserProfileSerializer, LoginSerializer
import requests

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


class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            # In production: from django.contrib.auth.forms import PasswordResetForm; form = PasswordResetForm({'email': email}); form.save(...)
            print(f"PASSWORD RESET REQUESTED FOR: {email}")
            return Response({"status": "Instructions sent."})
        except User.DoesNotExist:
            return Response({"status": "Instructions sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('password')
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response({"status": "Password reset successful."})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
