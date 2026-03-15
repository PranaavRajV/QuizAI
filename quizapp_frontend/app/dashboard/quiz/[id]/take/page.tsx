"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuiz } from '@/hooks/api-hooks';
import { Button } from '@/components/ui-components';
import { Modal } from '@/components/quiz-components';
import api from '@/lib/axios';
import { Timer, LogOut, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TakeQuizPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: quiz, isLoading, error } = useQuiz(id);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isAttemptStarting, setIsAttemptStarting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { choiceId?: number | null, typedAnswer?: string }>>({});
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Storage key scoped to this quiz (submit-time backup only) ────────────
  const ATTEMPT_KEY = `quiz_attempt_${id}`;

  // Initialize attempt — ALWAYS call /start/ so we get the canonical,
  // live attempt ID from the backend. The backend is idempotent: if an
  // incomplete attempt already exists it returns that one. This prevents
  // stale localStorage values causing 404s on answer submission.
  useEffect(() => {
    const startAttempt = async () => {
      try {
        const resp = await api.post(`/api/quizzes/${id}/start/`);
        const newAttemptId = resp.data.attempt_id;
        if (!newAttemptId) {
          toast.error('Could not start quiz — please try again.');
          setIsAttemptStarting(false);
          return;
        }
        // Mirror to localStorage as a submit-time backup only
        localStorage.setItem(ATTEMPT_KEY, String(newAttemptId));
        setAttemptId(newAttemptId);
      } catch (e: any) {
        const existingAttemptId = e?.response?.data?.attempt_id;
        if (existingAttemptId) {
          // Already completed — redirect straight to results
          localStorage.removeItem(ATTEMPT_KEY);
          router.replace(`/dashboard/quiz/${id}/results/${existingAttemptId}`);
          return; // navigating away, don't flip isAttemptStarting
        } else {
          console.error('Failed to start attempt', e?.response?.data);
          toast.error('Could not start quiz — please refresh and try again.');
        }
      } finally {
        setIsAttemptStarting(false);
      }
    };
    if (id) startAttempt();
  }, [id]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Next Question: pure local navigation, no API call ────────────────
  const handleNext = () => {
    if (!quiz) return;
    const currentQuestion = quiz.questions![currentIdx];
    const isTyped = currentQuestion?.type === 'typed';

    // Save current answer into state
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: isTyped ? { typedAnswer } : { choiceId: selectedChoiceId },
    };
    setAnswers(updatedAnswers);

    // Navigate forward
    setDirection('next');
    setIsTransitioning(true);
    setTimeout(() => {
      const nextIdx = currentIdx + 1;
      const nextQuestion = quiz.questions![nextIdx];
      const previous = updatedAnswers[nextQuestion.id];
      setCurrentIdx(nextIdx);
      setSelectedChoiceId((previous as any)?.choiceId ?? null);
      setTypedAnswer((previous as any)?.typedAnswer ?? '');
      setIsTransitioning(false);
    }, 150);
  };

  // ── Finish Quiz: single-shot submit of ALL answers ─────────────────────
  const handleFinish = async () => {
    if (!quiz) return;

    const resolvedAttemptId = attemptId ?? (Number(localStorage.getItem(ATTEMPT_KEY)) || null);
    if (!resolvedAttemptId) {
      toast.error('Session lost. Please refresh and start the quiz again.');
      return;
    }

    const currentQuestion = quiz.questions![currentIdx];
    const isTyped = currentQuestion?.type === 'typed';

    // Merge the current (last) question's answer
    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: isTyped ? { typedAnswer } : { choiceId: selectedChoiceId },
    };

    // Build the payload expected by /submit/
    const formatted = Object.entries(finalAnswers).map(([qId, ans]) => {
      const q = quiz.questions!.find(q => q.id === Number(qId));
      return {
        question: Number(qId),
        choice: q?.type === 'mcq' ? ((ans as any).choiceId ?? null) : null,
        typed_answer: q?.type === 'typed' ? ((ans as any).typedAnswer ?? null) : null,
      };
    });

    setIsSubmitting(true);
    try {
      await api.post(`/api/quizzes/attempts/${resolvedAttemptId}/submit/`, {
        answers: formatted,
      });
      localStorage.removeItem(ATTEMPT_KEY);
      router.push(`/dashboard/quiz/${id}/results/${resolvedAttemptId}`);
    } catch (e: any) {
      const detail = e?.response?.data?.error || e?.message || 'Unknown error';
      toast.error(`Submit failed: ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = quiz?.questions?.[currentIdx];
  const isTyped = currentQuestion?.type === 'typed';
  const canContinue = isTyped ? typedAnswer.trim().length > 0 : !!selectedChoiceId;
  const isLast = quiz ? currentIdx === quiz.questions!.length - 1 : false;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || isTransitioning || isQuitModalOpen) return;

      const mq = quiz?.questions![currentIdx];
      if (!mq) return;

      if (e.key === 'Enter' && canContinue) {
        if (isLast) {
          handleFinish();
        } else {
          handleNext();
        }
      } else if (mq.type === 'mcq' && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (mq.choices[idx]) {
          setSelectedChoiceId(mq.choices[idx].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quiz, currentIdx, isSubmitting, isTransitioning, canContinue, isQuitModalOpen, typedAnswer, selectedChoiceId, isLast]);

  if (isLoading) return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      Loading quiz content...
    </div>
  );
  if (error || !quiz) return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--danger)', fontSize: '14px' }}>
      Quiz failed to load.
    </div>
  );
  if (!quiz.questions || quiz.questions.length === 0 || !currentQuestion) return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      No questions in this quiz.
    </div>
  );
  // Block the quiz UI until we have a confirmed attempt ID.
  // This eliminates the async race where the user could answer Q1
  // before the POST /start/ had resolved, sending attemptId=null.
  if (isAttemptStarting) return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      Preparing your quiz…
    </div>
  );

  const total = quiz.questions.length;
  const progress = ((currentIdx + 1) / total) * 100;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsQuitModalOpen(true)}
            style={{ gap: '6px', color: 'var(--text-muted)' }}
          >
            <LogOut size={14} /> Quit
          </Button>
          <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>{quiz.topic}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Timer size={15} />
          <span style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, tabularNums: true } as any}>
            {formatTime(timeElapsed)}
          </span>
        </div>
      </div>

      {/* Progress section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Question {currentIdx + 1} of {total}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {Math.round(progress)}% Complete
          </span>
        </div>
        {/* Progress bar using CSS variables */}
        <div style={{ width: '100%', height: '5px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--accent)',
            borderRadius: '999px',
            transition: 'width 300ms ease-out',
          }} />
        </div>
      </div>

      {/* Question area with transitions */}
      <div style={{ position: 'relative', minHeight: '400px' }}>
        <section 
          className="glass-panel"
          style={{
            padding: '32px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning 
              ? `translateX(${direction === 'next' ? '-20px' : '20px'})` 
              : 'none',
            transition: 'all 150ms var(--ease)',
          }}
        >
          {/* Question text */}
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, letterSpacing: '-0.02em' }}>
            {currentQuestion.question_text}
          </h2>

          {isTyped ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <textarea
                 value={typedAnswer}
                 onChange={(e) => setTypedAnswer(e.target.value)}
                 placeholder="Type your answer here..."
                 disabled={isSubmitting}
                 className="form-input"
                 style={{ minHeight: '140px', padding: '16px', fontSize: '15px', resize: 'none' }}
               />
               <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                 Press Enter to proceed • {typedAnswer.length}/500
               </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQuestion.choices.map((choice, i) => {
                const isSelected = selectedChoiceId === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => setSelectedChoiceId(choice.id)}
                    disabled={isSubmitting}
                    className={`hover-lift active-push`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 150ms var(--ease)',
                      textAlign: 'left', outline: 'none',
                      boxShadow: isSelected ? '0 0 0 3px var(--accent-subtle)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 800, width: '22px', height: '22px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 'var(--radius-sm)', background: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                        color: isSelected ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)'
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 500, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {choice.choice_text}
                      </span>
                    </div>
                    {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />}
                  </button>
                );
              })}
              {!isTyped && <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                Use keys 1-4 to select • Enter to proceed
              </p>}
            </div>
          )}
        </section>
      </div>

      {/* Footer action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <Button
          variant="outline"
          size="lg"
          disabled={currentIdx === 0 || isSubmitting}
          onClick={() => {
            if (!quiz) return;
            const prevIdx = Math.max(0, currentIdx - 1);
            setDirection('prev');
            setIsTransitioning(true);
            setTimeout(() => {
              const prevQuestion = quiz.questions![prevIdx];
              const saved = answers[prevQuestion.id];
              setCurrentIdx(prevIdx);
              setSelectedChoiceId(saved?.choiceId ?? null);
              setTypedAnswer(saved?.typedAnswer ?? '');
              setIsTransitioning(false);
            }, 150);
          }}
          style={{ minWidth: '140px' }}
        >
          Previous
        </Button>

        {isLast ? (
          <Button
            variant="primary"
            size="lg"
            disabled={!canContinue || isSubmitting}
            onClick={handleFinish}
            isLoading={isSubmitting}
            style={{ gap: '8px', boxShadow: '0 4px 14px var(--accent-subtle)', minWidth: '180px' }}
          >
            Finish Quiz
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={!canContinue || isSubmitting}
            onClick={handleNext}
            style={{ gap: '8px', boxShadow: '0 4px 14px var(--accent-subtle)', minWidth: '180px' }}
          >
            Next Question
            <ChevronRight size={16} />
          </Button>
        )}
      </div>

      {/* Quit Modal */}
      <Modal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        title="Quit Quiz?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsQuitModalOpen(false)}>Continue Quiz</Button>
            <Button variant="danger" size="sm" onClick={() => router.push('/dashboard')}>Exit Anyway</Button>
          </>
        }
      >
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Your progress for this attempt will be lost. Are you sure you want to quit?
        </p>
      </Modal>
    </div>
  );
}
