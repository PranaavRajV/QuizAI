"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuiz } from '@/hooks/api-hooks';
import { Button } from '@/components/ui-components';
import { Modal } from '@/components/quiz-components';
import api from '@/lib/axios';
import { Timer, LogOut, ChevronRight } from 'lucide-react';

export default function TakeQuizPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: quiz, isLoading, error } = useQuiz(id);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { choiceId?: number | null, typedAnswer?: string }>>({});

  // Initialize attempt
  useEffect(() => {
    const startAttempt = async () => {
      try {
        const resp = await api.post(`/api/quizzes/${id}/start/`);
        setAttemptId(resp.data.attempt_id);
      } catch (e: any) {
        const existingAttemptId = e?.response?.data?.attempt_id;
        if (existingAttemptId) {
          // Already completed — redirect straight to results
          router.replace(`/dashboard/quiz/${id}/results/${existingAttemptId}`);
        } else {
          console.error("Failed to start attempt", e?.response?.data);
        }
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

  const handleNext = async () => {
    const currentQuestion = quiz?.questions![currentIdx];
    const isTyped = currentQuestion?.type === 'typed';
    const isMcq = currentQuestion?.type === 'mcq';

    const hasAnswer = isTyped ? typedAnswer.trim().length > 0 : !!selectedChoiceId;

    if (!hasAnswer || !attemptId || !quiz || isFinalSubmitted) return;
    
    setIsSubmitting(true);
    try {
      const question = quiz.questions![currentIdx];

      // Locally store answer for navigation
      setAnswers(prev => ({
        ...prev,
        [question.id]: isTyped ? { typedAnswer } : { choiceId: selectedChoiceId },
      }));

      // Submit the answer (idempotent per question)
      try {
        await api.post(`/api/quizzes/attempts/${attemptId}/answer/`, {
          question_id: question.id,
          choice_id: isMcq ? selectedChoiceId : null,
          typed_answer: isTyped ? typedAnswer : null,
        });
      } catch (answerErr: any) {
        // If attempt already completed, redirect to results
        if (answerErr?.response?.status === 400) {
          setIsFinalSubmitted(true);
          router.push(`/dashboard/quiz/${id}/results/${attemptId}`);
          return;
        }
        throw answerErr;
      }

      if (currentIdx < quiz.questions!.length - 1) {
        const nextIdx = currentIdx + 1;
        const nextQuestion = quiz.questions![nextIdx];
        const previous = answers[nextQuestion.id];
        
        setCurrentIdx(nextIdx);
        // Restore previous state if it exists
        setSelectedChoiceId(previous?.choiceId ?? null);
        setTypedAnswer(previous?.typedAnswer ?? '');
      } else {
        // Last question — complete the attempt
        try {
          await api.post(`/api/quizzes/attempts/${attemptId}/complete/`);
        } catch (completeErr: any) {
          // 400 = already completed — still redirect to results
          if (completeErr?.response?.status !== 400) {
            throw completeErr;
          }
        }
        setIsFinalSubmitted(true);
        // Always redirect to results after last question
        router.push(`/dashboard/quiz/${id}/results/${attemptId}`);
      }
    } catch (e: any) {
      const httpStatus = e?.response?.status;
      const detail = e?.response?.data?.error || e?.response?.data?.detail || e?.message || 'Unknown error';
      console.error('[Quiz] Submit failed:', { httpStatus, detail, data: e?.response?.data });
      alert(`Submit failed (${httpStatus || 'network error'}): ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
  if (!quiz.questions || quiz.questions.length === 0) return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      No questions in this quiz.
    </div>
  );

  const currentQuestion = quiz.questions[currentIdx];
  const isTyped = currentQuestion.type === 'typed';
  const total = quiz.questions.length;
  const progress = ((currentIdx + 1) / total) * 100;
  const isLast = currentIdx === total - 1;

  const canContinue = isTyped ? typedAnswer.trim().length > 0 : !!selectedChoiceId;

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

      {/* Question card */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Question text */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
        }}>
          {currentQuestion.question_text}
        </h2>

        {isTyped ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <textarea
               value={typedAnswer}
               onChange={(e) => setTypedAnswer(e.target.value)}
               placeholder="Type your answer here..."
               disabled={isSubmitting}
               style={{
                 width: '100%',
                 minHeight: '120px',
                 padding: '16px',
                 borderRadius: 'var(--radius-md)',
                 border: '1px solid var(--border)',
                 background: 'var(--bg-elevated)',
                 color: 'var(--text-primary)',
                 fontSize: '15px',
                 fontFamily: 'inherit',
                 resize: 'vertical',
                 outline: 'none',
                 transition: 'border-color 0.2s',
               }}
               onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
               onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
             />
             <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
               {typedAnswer.length} / 500 characters
             </p>
          </div>
        ) : (
          /* Choices */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentQuestion.choices.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => setSelectedChoiceId(choice.id)}
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '14px 18px',
                    minHeight: '54px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 120ms ease',
                    textAlign: 'left',
                    outline: 'none',
                    boxShadow: isSelected ? '0 0 0 3px var(--accent-subtle)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected && !isSubmitting) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hi)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-active)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                    }
                  }}
                >
                  <span style={{
                    fontSize: '14.5px',
                    fontWeight: 500,
                    color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    lineHeight: 1.4,
                    transition: 'color 120ms',
                  }}>
                    {choice.choice_text}
                  </span>

                  {/* Radio indicator */}
                  <div style={{
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-mid)'}`,
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 120ms ease',
                  }}>
                    {isSelected && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <Button
          variant="outline"
          size="lg"
          disabled={currentIdx === 0 || isSubmitting || isFinalSubmitted}
          onClick={() => {
            if (!quiz || isFinalSubmitted) return;
            const prevIdx = Math.max(0, currentIdx - 1);
            const prevQuestion = quiz.questions![prevIdx];
            const saved = answers[prevQuestion.id];
            
            setCurrentIdx(prevIdx);
            setSelectedChoiceId(saved?.choiceId ?? null);
            setTypedAnswer(saved?.typedAnswer ?? '');
          }}
          style={{ minWidth: '140px' }}
        >
          Previous
        </Button>

        <Button
          variant="primary"
          size="lg"
          disabled={!canContinue || isSubmitting || isFinalSubmitted}
          onClick={handleNext}
          isLoading={isSubmitting}
          style={{ gap: '8px', boxShadow: '0 4px 14px var(--accent-subtle)', minWidth: '180px' }}
        >
          {isLast ? 'Finish Quiz' : 'Next Question'}
          <ChevronRight size={16} />
        </Button>
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
