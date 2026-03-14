"""
Management command: seed_demo
Creates demo users, quizzes, attempts, friendship and challenge data.
Usage: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Seeds the database with demo data for evaluation/testing'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Delete existing demo users first')

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from quizzes.models import Quiz, Question, Choice, QuizAttempt, UserAnswer
        from social.models import Friendship, Challenge

        User = get_user_model()

        if options['flush']:
            User.objects.filter(email__in=['alice@demo.com', 'bob@demo.com']).delete()
            self.stdout.write(self.style.WARNING('Deleted existing demo users.'))

        # ── 1. Create users ──────────────────────────────────────────────
        alice, _ = User.objects.get_or_create(
            email='alice@demo.com',
            defaults={'username': 'alice_demo', 'is_active': True}
        )
        alice.set_password('Demo1234!')
        alice.save()

        bob, _ = User.objects.get_or_create(
            email='bob@demo.com',
            defaults={'username': 'bob_demo', 'is_active': True}
        )
        bob.set_password('Demo1234!')
        bob.save()

        self.stdout.write(f'  ✓ Users: alice@demo.com / bob@demo.com (password: Demo1234!)')

        # ── 2. Quizzes ───────────────────────────────────────────────────
        quiz_specs = [
            # Alice's quizzes
            ('Python async/await and concurrency', 'medium', alice),
            ('Machine Learning fundamentals', 'hard', alice),
            ('World War II major battles', 'easy', alice),
            ('React hooks and state management', 'medium', alice),
            ('Human digestive system', 'easy', alice),
            # Bob's quizzes
            ('JavaScript ES6+ features', 'medium', bob),
            ('Quantum mechanics basics', 'hard', bob),
            ('French Revolution causes and effects', 'medium', bob),
            ('SQL joins and subqueries', 'hard', bob),
            ('Solar system planets', 'easy', bob),
        ]

        quizzes = {}
        for topic, difficulty, owner in quiz_specs:
            quiz, created = Quiz.objects.get_or_create(
                topic=topic,
                created_by=owner,
                defaults={'difficulty': difficulty, 'num_questions': 5, 'is_active': True}
            )
            if created:
                # Create 5 simple questions per quiz
                for qi in range(5):
                    q = Question.objects.create(
                        quiz=quiz,
                        question_text=f'Sample question {qi + 1} about {topic}?',
                        explanation=f'Explanation for question {qi + 1}.',
                        order=qi,
                    )
                    for ci, choice_text in enumerate([
                        f'Correct answer for Q{qi + 1}',
                        f'Wrong answer A',
                        f'Wrong answer B',
                        f'Wrong answer C',
                    ]):
                        Choice.objects.create(
                            question=q,
                            choice_text=choice_text,
                            is_correct=(ci == 0)
                        )
            quizzes[topic] = quiz
        self.stdout.write(f'  ✓ {len(quizzes)} quizzes created')

        # ── 3. Completed attempts ────────────────────────────────────────
        attempt_data = [
            (alice, 'Python async/await and concurrency', 85.0, 4, 14),
            (alice, 'Machine Learning fundamentals', 60.0, 3, 11),
            (alice, 'World War II major battles', 100.0, 5, 5),
            (alice, 'React hooks and state management', 75.0, 4, 8),
            (bob, 'JavaScript ES6+ features', 90.0, 5, 10),
            (bob, 'Quantum mechanics basics', 40.0, 2, 15),
            (bob, 'French Revolution causes and effects', 80.0, 4, 9),
        ]

        for user, topic, score, correct, days_ago in attempt_data:
            quiz = quizzes.get(topic)
            if not quiz:
                continue
            completed = timezone.now() - timedelta(days=days_ago)
            QuizAttempt.objects.get_or_create(
                user=user,
                quiz=quiz,
                defaults={
                    'score': score,
                    'correct_count': correct,
                    'total_questions': 5,
                    'is_completed': True,
                    'started_at': completed - timedelta(minutes=10),
                    'completed_at': completed,
                }
            )
        self.stdout.write(f'  ✓ {len(attempt_data)} quiz attempts created')

        # ── 4. Friendship ────────────────────────────────────────────────
        friendship, _ = Friendship.objects.get_or_create(
            from_user=alice,
            to_user=bob,
            defaults={'status': 'accepted'}
        )
        self.stdout.write('  ✓ Alice ↔ Bob friendship created')

        # ── 5. Active challenge ──────────────────────────────────────────
        shared_quiz = quizzes.get('Python async/await and concurrency')
        if shared_quiz:
            Challenge.objects.get_or_create(
                challenger=alice,
                challenged=bob,
                quiz=shared_quiz,
                defaults={'status': 'pending'}
            )
            self.stdout.write('  ✓ 1 active challenge: Alice challenged Bob on "Python async/await"')

        self.stdout.write(self.style.SUCCESS(
            '\n✅ Demo data seeded successfully!\n'
            '   Login as: alice@demo.com / Demo1234!  or  bob@demo.com / Demo1234!'
        ))
