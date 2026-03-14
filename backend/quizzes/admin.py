from django.contrib import admin
from .models import Quiz, Question, Choice, QuizAttempt, UserAnswer

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('topic', 'difficulty', 'num_questions', 'created_by', 'created_at', 'is_active')
    list_filter = ('difficulty', 'is_active', 'created_at')
    search_fields = ('topic',)
    inlines = [QuestionInline]

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'quiz', 'order')
    inlines = [ChoiceInline]

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'correct_count', 'total_questions', 'is_completed', 'started_at')
    list_filter = ('is_completed', 'started_at')

admin.site.register(Choice)
admin.site.register(UserAnswer)
