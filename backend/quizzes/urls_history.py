from django.urls import path
from .views import HistoryView

urlpatterns = [
    path('', HistoryView.as_view({'get': 'list'}), name='user_quiz_history'),
]
