from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import Notification

def send_notification_email(user, subject, template_name, context):
    if not getattr(user, 'email_notifications', True):
        return
    try:
        html_message = render_to_string(f'emails/{template_name}', context)
        plain_message = strip_tags(html_message)
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=True,
        )
    except Exception:
        # Email delivery failure should never break core API functionality
        pass

def send_challenge_received(user, challenger, quiz_topic):
    # Also create in-app notification
    Notification.objects.create(
        user=user, 
        type='challenge_received', 
        message=f"{challenger.username} challenged you to a quiz on {quiz_topic}."
    )
    
    send_notification_email(
        user,
        f"You have a new challenge from {challenger.username}!",
        "challenge_received.html",
        {"user": user, "challenger": challenger, "quiz_topic": quiz_topic}
    )

def send_challenge_completed(user, opponent, your_score, their_score, won):
    Notification.objects.create(
        user=user, 
        type='challenge_completed', 
        message=f"Challenge against {opponent.username} finished. You {'won' if won else 'lost'} ({your_score} vs {their_score})."
    )

    send_notification_email(
        user,
        f"Challenge Results: {opponent.username}",
        "challenge_completed.html",
        {"user": user, "opponent": opponent, "your_score": your_score, "their_score": their_score, "won": won}
    )

def send_friend_request(user, from_user):
    Notification.objects.create(
        user=user, 
        type='friend_request', 
        message=f"{from_user.username} sent you a friend request."
    )

    send_notification_email(
        user,
        f"New friend request from {from_user.username}",
        "friend_request.html",
        {"user": user, "from_user": from_user}
    )

def send_weekly_summary(user, quizzes_this_week, avg_score, rank):
    Notification.objects.create(
        user=user, 
        type='weekly_summary', 
        message=f"Your weekly summary is ready. Quizzes: {quizzes_this_week}, Avg Score: {avg_score}%."
    )

    send_notification_email(
        user,
        "Your Weekly PurpleQuiz AI Summary",
        "weekly_summary.html",
        {"user": user, "quizzes_this_week": quizzes_this_week, "avg_score": avg_score, "rank": rank}
    )
