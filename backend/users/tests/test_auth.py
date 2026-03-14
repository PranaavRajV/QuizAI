import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import UserFactory

User = get_user_model()

@pytest.mark.django_db
class TestAuth:
    def test_register_success(self, api_client):
        url = reverse('auth_register')
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "password_confirm": "password123",
            "bio": "Hello world"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email="test@example.com").exists()
        # Note: Our RegisterView doesn't return tokens directly, the user should login.
        # But if you wanted tokens on registration, the serializer would need to be updated.
        # For now, we test the creation success.

    def test_register_duplicate_email(self, api_client):
        UserFactory(email="duplicate@example.com")
        url = reverse('auth_register')
        data = {
            "username": "newuser",
            "email": "duplicate@example.com",
            "password": "password123",
            "password_confirm": "password123"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, api_client):
        url = reverse('auth_register')
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "password_confirm": "wrongpassword"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_success(self, api_client):
        user = UserFactory(email="login@example.com")
        url = reverse('auth_login')
        data = {
            "email": "login@example.com",
            "password": "password123"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password(self, api_client):
        UserFactory(email="wrongpass@example.com")
        url = reverse('auth_login')
        data = {
            "email": "wrongpass@example.com",
            "password": "incorrectpassword"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_authenticated(self, api_client):
        user = UserFactory()
        api_client.force_authenticate(user=user)
        url = reverse('auth_me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email

    def test_me_unauthenticated(self, api_client):
        url = reverse('auth_me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
