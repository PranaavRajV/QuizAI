from django.urls import path
from .views import NotificationListView, NotificationReadAllView, NotificationReadOneView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications-list'),
    path('read-all/', NotificationReadAllView.as_view(), name='notifications-read-all'),
    path('<int:pk>/read/', NotificationReadOneView.as_view(), name='notification-read-one'),
]
