from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from quizzes.models import Quiz, Question, Choice

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with test users and quizzes'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # 1. Create Test Users
        users_data = [
            {'email': 'testuser1@test.com', 'username': 'testuser1', 'bio': 'Expert tester 1'},
            {'email': 'testuser2@test.com', 'username': 'testuser2', 'bio': 'Quick solver 2'},
        ]
        
        seeded_users = []
        for u_data in users_data:
            user, created = User.objects.get_or_create(
                email=u_data['email'],
                defaults={'username': u_data['username'], 'bio': u_data['bio']}
            )
            if created:
                user.set_password('Test@1234')
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user: {user.email}"))
            else:
                self.stdout.write(f"User {user.email} already exists")
            seeded_users.append(user)

        # 2. Define Quiz Samples
        quiz_templates = [
            {
                'topic': 'Python Fundamentals',
                'difficulty': 'easy',
                'questions': [
                    ('What is the correct extension for Python files?', ['.py', '.python', '.pyt', '.pt'], '.py'),
                    ('Which collection is ordered, changeable, and allows duplicates?', ['List', 'Set', 'Tuple', 'Dictionary'], 'List'),
                    ('How do you start a comment in Python?', ['#', '//', '/*', '--'], '#'),
                    ('Which function is used to get the length of a list?', ['len()', 'length()', 'size()', 'count()'], 'len()'),
                    ('Which operator can be used to compare two values?', ['==', '=', '<>', '!='], '=='),
                ]
            },
            {
                'topic': 'Web Development (React/Next)',
                'difficulty': 'medium',
                'questions': [
                    ('In React, what is the purpose of "useState"?', ['To manage local state', 'To fetch data', 'To style components', 'To route pages'], 'To manage local state'),
                    ('What does SSR stand for in Next.js?', ['Server-Side Rendering', 'Static Site Response', 'Simple State Router', 'Server Schema React'], 'Server-Side Rendering'),
                    ('Which file is used for routing in Next.js App Router?', ['page.tsx', 'route.js', 'index.html', 'app.js'], 'page.tsx'),
                    ('How do you pass data from a parent to a child component?', ['Props', 'State', 'Context', 'Hooks'], 'Props'),
                    ('Which hook is used for side effects in React?', ['useEffect', 'useSideEffect', 'useAction', 'useEvent'], 'useEffect'),
                ]
            },
            {
                'topic': 'Database Design & SQL',
                'difficulty': 'hard',
                'questions': [
                    ('What does ACID stand for in databases?', ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Integrity, Data', 'Array, Chain, Index, Document', 'All, Clear, Internal, Delete'], 'Atomicity, Consistency, Isolation, Durability'),
                    ('Which SQL clause is used to filter records in a group?', ['HAVING', 'WHERE', 'GROUP BY', 'SORT'], 'HAVING'),
                    ('What is a "Foreign Key"?', ['A field that links two tables', 'A unique ID for a row', 'A hidden encrypted key', 'A primary key of a remote DB'], 'A field that links two tables'),
                    ('What is the difference between INNER and LEFT JOIN?', ['INNER returns matching rows only, LEFT returns all from left table', 'INNER is faster, LEFT is slower', 'INNER is for numbers, LEFT is for text', 'No difference'], 'INNER returns matching rows only, LEFT returns all from left table'),
                    ('Which normal form deals with partial functional dependencies?', ['2NF', '1NF', '3NF', 'BCNF'], '2NF'),
                ]
            }
        ]

        # 3. Seed Quizzes for each user
        for user in seeded_users:
            for template in quiz_templates:
                quiz = Quiz.objects.create(
                    topic=f"{template['topic']} ({user.username})",
                    difficulty=template['difficulty'],
                    num_questions=len(template['questions']),
                    created_by=user
                )
                
                for idx, (q_text, choices, correct_ans) in enumerate(template['questions']):
                    question = Question.objects.create(
                        quiz=quiz,
                        question_text=q_text,
                        order=idx
                    )
                    for c_text in choices:
                        Choice.objects.create(
                            question=question,
                            choice_text=c_text,
                            is_correct=(c_text == correct_ans)
                        )
                
                self.stdout.write(self.style.SUCCESS(f"Seeded quiz: {quiz.topic} for {user.email}"))

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
