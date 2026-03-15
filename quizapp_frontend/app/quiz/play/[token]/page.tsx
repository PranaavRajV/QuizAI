"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui-components';
import { Timer, Sparkles, Brain, Trophy, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { Quiz, Question, QuizAttempt } from '@/types/api';

export default function PublicPlayPage() {
  const router = useRouter();
  const { token } = useParams() as { token: string };

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Fetch quiz & Start attempt
  useEffect(() => {
    const init = async () => {
      try {
        const quizResp = await api.get(`/api/quizzes/play/${token}/`);
        setQuiz(quizResp.data);

        const startResp = await api.post(`/api/quizzes/${quizResp.data.id}/start/`);
        setAttemptId(startResp.data.attempt_id);
      } catch (e) {
        console.error("Failed to load public quiz", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) init();
  }, [token]);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  const handleNext = async () => {
    if (!quiz || !attemptId || isSubmitting) return;
    
    const question = quiz.questions![currentIdx];
    const isTyped = question.type === 'typed';
    const hasAnswer = isTyped ? typedAnswer.trim().length > 0 : !!selectedChoiceId;

    if (!hasAnswer) return;

    setIsSubmitting(true);
    try {
      await api.post(`/api/quizzes/attempts/${attemptId}/answer/`, {
        question_id: question.id,
        choice_id: isTyped ? null : selectedChoiceId,
        typed_answer: isTyped ? typedAnswer : null,
      });

      if (currentIdx < quiz.questions!.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setSelectedChoiceId(null);
        setTypedAnswer('');
      } else {
        // Complete
        const completeResp = await api.post(`/api/quizzes/play/${token}/submit/`, {
          attempt_id: attemptId
        });
        setScore(completeResp.data.score);
        setIsCompleted(true);
      }
    } catch (e) {
      console.error("Submission failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Loading Quiz...</div>;
  if (!quiz) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--danger)' }}>Quiz not found or it's no longer public.</div>;

  if (isCompleted) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 32px' }}>
          <Trophy size={60} color="var(--warn)" style={{ margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Quiz Completed!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>You've finished the shared quiz: <strong>{quiz.topic}</strong></p>
          
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Your Score: <span style={{ fontSize: '48px', fontWeight: 900, color: 'var(--accent)', display: 'block', margin: '12px 0' }}>{Math.round(score || 0)}%</span>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button variant="primary" size="lg" onClick={() => router.push('/register')} style={{ width: '100%' }}>
              Create an Account to Save Progress
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.reload()} style={{ width: '100%' }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions![currentIdx];
  const progress = ((currentIdx + 1) / quiz.questions!.length) * 100;

  return (
    <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <Brain size={20} color="var(--accent)" />
           <span style={{ fontWeight: 700, fontSize: '15px' }}>{quiz.topic}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <Timer size={16} /> {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.4, marginBottom: '32px' }}>{currentQuestion.question_text}</h2>

        {currentQuestion.type === 'typed' ? (
          <textarea
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder="Type your answer..."
            style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQuestion.choices.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChoiceId(c.id)}
                style={{
                  padding: '16px 20px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                  border: `1px solid ${selectedChoiceId === c.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedChoiceId === c.id ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                  color: selectedChoiceId === c.id ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {c.choice_text}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={handleNext} isLoading={isSubmitting} disabled={isSubmitting} style={{ minWidth: '160px', gap: '8px' }}>
          {currentIdx === quiz.questions!.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}
