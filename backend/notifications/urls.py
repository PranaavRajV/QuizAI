from django.urls import path
from .views import NotificationListView, NotificationReadAllView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications-list'),
    path('read-all/', NotificationReadAllView.as_view(), name='notifications-read-all'),
]
