"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSharedQuiz } from '@/hooks/api-hooks';
import { Button, Card } from '@/components/ui-components';
import { ProgressBar, CircularScore } from '@/components/quiz-components';
import api from '@/lib/axios';
import { clsx } from 'clsx';
import { Timer, ChevronRight, Share2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function SharedQuizPage() {
  const router = useRouter();
  const { token } = useParams() as { token: string };
  const { data: quiz, isLoading, error } = useSharedQuiz(token);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Timer
  useEffect(() => {
    if (!attemptId || isCompleted) return;
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [attemptId, isCompleted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startQuiz = async () => {
    if (!quiz) return;
    try {
      const resp = await api.post(`/api/quizzes/${quiz.id}/start/`);
      setAttemptId(resp.data.attempt_id);
    } catch (e) {
      alert("Failed to start quiz. Please try again.");
    }
  };

  const handleNext = async () => {
    if (!selectedChoiceId || !attemptId || !quiz) return;
    
    setIsSubmitting(true);
    try {
      const question = quiz.questions![currentIdx];
      await api.post(`/api/quizzes/attempts/${attemptId}/answer/`, {
        question_id: question.id,
        choice_id: selectedChoiceId
      });

      if (currentIdx < quiz.questions!.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setSelectedChoiceId(null);
      } else {
        // Complete quiz
        const resp = await api.post(`/api/quizzes/attempts/${attemptId}/complete/`);
        setResults(resp.data);
        setIsCompleted(true);
      }
    } catch (e) {
      alert("Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-[#64748b]">Loading quiz...</div>;
  if (error || !quiz) return (
    <div className="p-12 text-center">
      <h2 className="text-xl font-bold text-[#DC2626] mb-4">Quiz not found</h2>
      <p className="text-[#64748b] mb-6">This link may be invalid or the quiz was deleted.</p>
      <Link href="/login">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );

  // Initial State: Intro
  if (!attemptId && !isCompleted) {
    return (
      <div className="max-w-[500px] mx-auto py-12 px-4 space-y-8 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl mx-auto flex items-center justify-center text-[var(--accent-fg)] mb-6">
            <Share2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{quiz.topic}</h1>
          <p className="text-[var(--ink2)]">
            Shared by <span className="text-[var(--accent)] font-semibold">{quiz.created_by_name}</span>
          </p>
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="px-3 py-1 bg-[var(--bg2)] rounded-full text-[12px] font-bold uppercase tracking-wider text-[var(--ink2)]">
              {quiz.difficulty}
            </div>
            <div className="px-3 py-1 bg-[var(--bg2)] rounded-full text-[12px] font-bold uppercase tracking-wider text-[var(--ink2)]">
              {quiz.num_questions} Questions
            </div>
          </div>
        </div>
        
        <Card className="p-6 bg-[var(--bg2)] border-[var(--line2)]">
          <p className="text-sm text-[var(--ink2)] mb-6 leading-relaxed">
            Anyone with this link can take this quiz. Results are shown at the end. 
            Sign in to track your performance and history.
          </p>
          <Button className="w-full h-12" onClick={startQuiz}>
            Start Quiz Now
          </Button>
        </Card>

        <p className="text-[12px] text-[#94a3b8]">
          Powered by QuizAI
        </p>
      </div>
    );
  }

  // Final State: Results
  if (isCompleted && results) {
    return (
      <div className="max-w-[600px] mx-auto py-12 px-4 space-y-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-[var(--ink)]">Quiz Completed!</h1>
          <p className="text-[var(--ink2)]">Great job finishing the quiz on <span className="font-semibold text-[var(--accent)]">{quiz.topic}</span></p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <CircularScore score={results.score} size={180} />
          <div className="grid grid-cols-2 gap-8 w-full max-w-[320px]">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--ink)]">{results.correct_count}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink3)]">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--ink)]">{results.total_questions}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink3)]">Total</p>
            </div>
          </div>
        </div>

        <Card className="p-6 bg-[var(--accent)] border-none text-[var(--accent-fg)] space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Save your progress?</h3>
            <p className="text-sm opacity-80">Create a free account to save these results and generate your own AI quizzes.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/register">
              <Button className="w-full bg-[var(--accent-fg)] text-[var(--accent)] hover:bg-black/90">Sign Up Free</Button>
            </Link>
            <Link href="/login">
              <span className="text-xs opacity-70 hover:opacity-100 cursor-pointer underline">Already have an account? Log in</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Playing State
  const currentQuestion = quiz.questions![currentIdx];
  const progress = ((currentIdx + 1) / quiz.questions!.length) * 100;

  return (
    <div className="max-w-[800px] mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-bold">{quiz.topic}</p>
        <div className="flex items-center gap-2 text-[#64748b]">
          <Timer className="w-4 h-4" />
          <span className="text-[14px] font-mono font-bold">{formatTime(timeElapsed)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
          <span>Question {currentIdx + 1} of {quiz.questions!.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <ProgressBar progress={progress} />
      </div>

      <Card className="p-8 bg-[var(--bg)] border-[var(--line2)] shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold mb-10 leading-snug text-[var(--ink)]">
          {currentQuestion.question_text}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => setSelectedChoiceId(choice.id)}
              disabled={isSubmitting}
              className={clsx(
                "flex items-center justify-between p-4 rounded-[10px] border text-left transition-all",
                selectedChoiceId === choice.id
                  ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-fg)]"
                  : "bg-[var(--bg2)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink3)]"
              )}
            >
              <span className="text-[15px] font-medium">{choice.choice_text}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          className="h-12 px-8 gap-2" 
          disabled={!selectedChoiceId || isSubmitting}
          onClick={handleNext}
          isLoading={isSubmitting}
        >
          {currentIdx === quiz.questions!.length - 1 ? 'Finish Quiz' : 'Next Question'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
