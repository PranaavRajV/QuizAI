from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, AttemptViewSet, HistoryView, AnalyticsView, PublicPlayViewSet, RoomViewSet, ShareQuizView

router = DefaultRouter()
router.register(r'play', PublicPlayViewSet, basename='public-play')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'attempts', AttemptViewSet, basename='attempt')
router.register(r'', QuizViewSet, basename='quiz')

urlpatterns = [
    path('history/', HistoryView.as_view({'get': 'list'}), name='quiz_history'),
    path('analytics/', AnalyticsView.as_view({'get': 'get_analytics'}), name='quiz_analytics'),
    path('<int:pk>/share/', ShareQuizView.as_view(), name='share_quiz'),
    path('', include(router.urls)),
]
