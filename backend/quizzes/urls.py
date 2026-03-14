from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, AttemptViewSet, HistoryView, AnalyticsView

router = DefaultRouter()
router.register(r'', QuizViewSet, basename='quiz')
router.register(r'attempts', AttemptViewSet, basename='attempt')

urlpatterns = [
    path('history/', HistoryView.as_view({'get': 'list'}), name='quiz_history'),
    path('analytics/', AnalyticsView.as_view({'get': 'get_analytics'}), name='quiz_analytics'),
    path('', include(router.urls)),
]
