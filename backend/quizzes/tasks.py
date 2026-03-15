from celery import shared_task
from django.utils import timezone

from .models import QuizAttempt, UserAnswer
from ai_service.openrouter import OpenRouterService
from notifications.emails import send_challenge_completed as send_email_sync


@shared_task
def evaluate_typed_answers(attempt_id: int):
    """
    Evaluate all typed answers for a given attempt asynchronously.
    """
    try:
        attempt = QuizAttempt.objects.select_related('quiz').get(id=attempt_id)
    except QuizAttempt.DoesNotExist:
        return

    # Mark as processing
    attempt.evaluation_status = 'processing'
    attempt.save(update_fields=['evaluation_status'])

    ai_service = OpenRouterService()

    typed_answers = (
        UserAnswer.objects
        .select_related('question')
        .filter(attempt=attempt, question__type='typed')
    )

    for ua in typed_answers:
        correct = ua.question.correct_answer or ""
        user_ans = ua.typed_answer or ""
        if not user_ans.strip():
            ua.is_correct = False
            ua.feedback = "No answer was provided."
            ua.save(update_fields=['is_correct', 'feedback'])
            continue

        result = ai_service.evaluate_typed_answer(correct_answer=correct, user_answer=user_ans)
        ua.is_correct = bool(result.get("is_correct"))
        ua.feedback = result.get("feedback") or ""
        ua.save(update_fields=['is_correct', 'feedback'])

    # When done, recalculate final score
    answers = UserAnswer.objects.filter(attempt=attempt)
    correct_count = answers.filter(is_correct=True).count()
    
    attempt.correct_count = correct_count
    attempt.score = (correct_count / attempt.total_questions) * 100 if attempt.total_questions > 0 else 0
    attempt.evaluation_status = 'completed'
    attempt.save(update_fields=['correct_count', 'score', 'evaluation_status'])

@shared_task
def notify_challenge_completed(user_id, opponent_id, your_score, their_score, won):
    """Async task for sending challenge completion emails."""
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        opponent = User.objects.get(id=opponent_id)
        send_email_sync(user, opponent, your_score, their_score, won)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Async notification task failed: {e}")
