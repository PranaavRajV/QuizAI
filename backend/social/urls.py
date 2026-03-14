from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FriendViewSet, LeaderboardViewSet, ChallengeViewSet, ShareViewSet, NotificationsView

router = DefaultRouter()
router.register(r'friends', FriendViewSet, basename='friends')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'challenges', ChallengeViewSet, basename='challenges')
router.register(r'share', ShareViewSet, basename='share')
router.register(r'notifications', NotificationsView, basename='notifications')

urlpatterns = [
    path('', include(router.urls)),
    # Manual path for public share if needed, though router.register handles it
    path('public-share/<uuid:token>/', ShareViewSet.as_view({'get': 'public_get'}), name='public_share_get'),
]
