"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui-components';
import { useCreateQuiz } from '@/hooks/api-hooks';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Sparkles, Brain, Zap, Target, ArrowRight,
  RotateCcw, BookOpen, ChevronRight, AlertCircle, Play,
} from 'lucide-react';

/* ── rotating messages ───────────────────────────────────── */
const MSGS = [
  "Consulting the digital oracle…",
  "High-quality questions take a moment to bake…",
  "Sifting through the knowledge graph…",
  "Curating a perfect challenge for you…",
  "Free AI models can be slow — thanks for your patience!",
];

/* ── Difficulty pills config ─────────────────────────────── */
const DIFFICULTIES = [
  { id: 'easy',   Icon: Target, label: 'Easy',   desc: 'Factual recall',    accent: 'var(--success)',       accentBg: 'var(--success-subtle)',  accentBorder: 'var(--success-border)' },
  { id: 'medium', Icon: Zap,    label: 'Medium', desc: 'Application',       accent: 'var(--warn)',          accentBg: 'var(--warn-subtle)',     accentBorder: 'var(--warn-border)' },
  { id: 'hard',   Icon: Brain,  label: 'Hard',   desc: 'Critical analysis', accent: 'var(--danger)',        accentBg: 'var(--danger-subtle)',   accentBorder: 'var(--danger-border)' },
] as const;


import { QuizConfig } from '@/types/api';

export default function CreateQuizPage() {
  const router = useRouter();
  const { createQuiz, isLoading, error, data: generatedQuiz } = useCreateQuiz();

  const [topic, setTopic]               = useState('');
  const [difficulty, setDifficulty]     = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [msgIdx, setMsgIdx]             = useState(0);
  const [lastConfig, setLastConfig]     = useState<QuizConfig | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => setMsgIdx(i => (i + 1) % MSGS.length), 2800);
    return () => clearInterval(id);
  }, [isLoading]);

  const retryLastConfig = () => {
    if (lastConfig) {
      // Re-trigger the logic directly
      handleGenerate(lastConfig);
    }
  };

  const handleError = (e: any) => {
    const isTimeout = e.code === 'ECONNABORTED' || e.message?.includes('timeout');
    const isRateLimit = e.response?.status === 429 || e.response?.data?.code === 'RATE_LIMIT';
    
    const msg = isTimeout
      ? 'AI is taking longer than expected. The server is still working, check your "My Quizzes" page in a minute!'
      : isRateLimit
      ? 'AI is a bit busy right now. Please wait 30 seconds and try again.'
      : e.response?.data?.code === 'ALL_MODELS_FAILED'
      ? 'All free AI models are currently busy. Try a more specific topic or retry in a moment.'
      : e.response?.data?.message || e.response?.data?.error || 'AI service error. Try a different topic.';
    
    toast.error(msg, { duration: 6000 });
  };

  const handleGenerate = async (config: QuizConfig) => {
    try {
      const res = await createQuiz({ 
        topic: config.topic, 
        difficulty: config.difficulty, 
        num_questions: config.num_questions,
        quiz_config: config 
      }, 45000); 
      toast.success('Quiz generated! Starting now...');
      if (res?.id) {
        router.push(`/dashboard/quiz/${res.id}/take`);
      }
    } catch (e: any) {
      handleError(e);
    }
  };

  /* ─── Loading state ──────────────────────────────────────── */
  if (isLoading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '24px',
        textAlign: 'center',
      }}>
        {/* Spinner */}
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid var(--border)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--accent)',
            animation: 'qs-spin 0.9s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={28} color="var(--accent)" />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Generating your quiz
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', transition: 'opacity 400ms' }}>
            {MSGS[msgIdx]}
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {MSGS.map((_, i) => (
            <div key={i} style={{
              width: i === msgIdx ? '20px' : '6px', height: '6px',
              borderRadius: '99px',
              background: i === msgIdx ? 'var(--accent)' : 'var(--border)',
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>
      </div>
    );
  }

  /* ─── Success / quiz ready ───────────────────────────────── */
  if (generatedQuiz) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', alignItems: 'start' }}>

        {/* Left: quiz summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Ready banner */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover, #4f46e5) 100%)',
              padding: '28px 24px',
              display: 'flex', flexDirection: 'column', gap: '8px',
              position: 'relative', overflow: 'hidden',
            }}>
              <Sparkles size={80} style={{ position: 'absolute', right: '-16px', top: '-16px', opacity: 0.12, color: '#fff' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles size={13} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Quiz Ready
                </span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                {generatedQuiz.topic}
              </h1>
            </div>

            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Difficulty', value: generatedQuiz.difficulty },
                { label: 'Questions',  value: generatedQuiz.num_questions },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="primary" size="lg"
                style={{ width: '100%', gap: '8px', justifyContent: 'center', boxShadow: '0 4px 14px var(--accent-subtle)' }}
                onClick={() => router.push(`/dashboard/quiz/${generatedQuiz.id}/take`)}
              >
                <Play size={16} /> Start Quiz Now
              </Button>
              <Button
                variant="outline" size="md"
                style={{ width: '100%', gap: '8px', justifyContent: 'center' }}
                onClick={() => (window as any).location.reload()}
              >
                <RotateCcw size={14} /> Generate Another
              </Button>
            </div>
          </div>
        </div>

        {/* Right: question preview */}
        <section style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Question Preview
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Showing first 3
            </span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {generatedQuiz.questions?.slice(0, 3).map((q, i) => (
              <div key={i} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '14px 16px',
              }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Q{i + 1}
                </p>
                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {q.question_text}
                </p>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <Button
              variant="ghost" size="sm"
              style={{ width: '100%', gap: '6px', color: 'var(--text-muted)', justifyContent: 'center' }}
              onClick={() => router.push(`/dashboard/quiz/${generatedQuiz.id}/take`)}
            >
              See all {generatedQuiz.num_questions} questions <ChevronRight size={13} />
            </Button>
          </div>
        </section>
      </div>
    );
  }

  /* ─── Main form ──────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px', alignItems: 'start' }}>

      {/* LEFT: form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="var(--warn)" style={{ opacity: 0.9 }} />
            Generate a Quiz
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-tertiary)' }}>
            Tell the AI what you want to learn — it'll craft the perfect challenge.
          </p>
        </div>

        {/* Topic input card */}
        <section style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quiz Topic
            </h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              id="quiz-topic-input"
              aria-label="Quiz topic"
              value={topic}
              onChange={e => setTopic(e.target.value.slice(0, 100))}
              placeholder="e.g. React hooks and state management, Quantum Physics fundamentals, French Revolution causes…"
              rows={3}
              maxLength={100}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)', fontSize: '14px',
                color: 'var(--text-primary)', lineHeight: 1.5,
                outline: 'none', resize: 'none', boxSizing: 'border-box',
                transition: 'border-color 120ms ease',
              }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
              onBlur={e  => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Be specific for sharper questions — e.g. &ldquo;Python async/await&rdquo; vs &ldquo;Python&rdquo;
              </p>
              <span style={{
                fontSize: '11px', fontWeight: 600,
                color: topic.length > 90 ? 'var(--danger)' : topic.length > 70 ? 'var(--warn)' : 'var(--text-muted)',
                transition: 'color 120ms ease',
                flexShrink: 0, marginLeft: '8px',
              }}>
                {topic.length}/100
              </span>
            </div>
          </div>
        </section>

        {/* Difficulty card */}
        <section style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Difficulty Level
            </h3>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {DIFFICULTIES.map(({ id, Icon, label, desc, accent, accentBg, accentBorder }) => {
              const active = difficulty === id;
              return (
                <button
                  key={id}
                  onClick={() => setDifficulty(id as any)}
                  style={{
                    padding: '16px 12px', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? accentBorder : 'var(--border)'}`,
                    background: active ? accentBg : 'var(--bg-elevated)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 140ms ease',
                    outline: 'none',
                    boxShadow: active ? `0 0 0 3px ${accentBg}` : 'none',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = accentBorder; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                >
                  <Icon size={18} color={active ? accent : 'var(--text-muted)'} style={{ marginBottom: '10px' }} />
                  <p style={{ fontSize: '13px', fontWeight: 700, color: active ? accent : 'var(--text-primary)', marginBottom: '3px' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Questions slider card */}
        <section style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Number of Questions
            </h3>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.04em' }}>
              {numQuestions}
            </span>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>5</span>
              <input
                type="range" min="5" max="20" value={numQuestions}
                onChange={e => setNumQuestions(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent)', height: '4px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>20</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  style={{
                    fontSize: '11px', fontWeight: 600,
                    padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: numQuestions === n ? 'var(--accent)' : 'var(--border)',
                    background: numQuestions === n ? 'var(--accent-subtle)' : 'transparent',
                    color: numQuestions === n ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 120ms ease',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            padding: '14px 18px',
            background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={16} color="var(--danger)" />
              <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 500 }}>
                {error.includes('ALL_MODELS_FAILED') || error.includes('All AI models')
                  ? 'AI is temporarily busy — try again in a moment.'
                  : error}
              </p>
            </div>
            <Button 
               variant="outline" 
               size="sm" 
               onClick={retryLastConfig} 
               style={{ flexShrink: 0, borderColor: 'var(--danger)', color: 'var(--danger)', gap: '6px' }}
            >
              <RotateCcw size={13} /> Retry
            </Button>
          </div>
        )}

        {/* CTA button */}
        <Button
          variant="primary" size="lg"
          disabled={!topic.trim() || isLoading}
          onClick={() => {
            if (!topic.trim()) { toast.error('Please enter a topic first.'); return; }
            const config: QuizConfig = {
              topic,
              difficulty,
              num_questions: numQuestions,
              question_types: ['mcq'],
              time_per_question: 30,
              points_per_question: 10
            };
            setLastConfig(config);
            handleGenerate(config);
          }}
          style={{ width: '100%', gap: '8px', justifyContent: 'center', boxShadow: topic.trim() ? '0 4px 14px var(--accent-subtle)' : 'none' }}
        >
          <Sparkles size={17} />
          Generate Quiz
          <ArrowRight size={15} />
        </Button>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
          * Free AI generation usually takes 30-60 seconds.
        </p>
      </div>

      {/* RIGHT: tips sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* AI info card */}
        <section style={{
          background: 'var(--accent)', color: '#fff',
          borderRadius: 'var(--radius-lg)', padding: '28px 24px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 24px var(--accent-subtle)',
        }}>
          <Sparkles size={120} style={{ position: 'absolute', top: '-30px', right: '-30px', opacity: 0.1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Brain size={18} color="rgba(255,255,255,0.9)" />
            <h4 style={{ fontSize: '15px', fontWeight: 700 }}>AI-Powered Questions</h4>
          </div>
          <p style={{ fontSize: '13px', opacity: 0.88, lineHeight: 1.6, marginBottom: '20px' }}>
            Our AI studies your topic and generates unique, curriculum-aligned questions — no two quizzes are ever the same.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Unique questions every time', 'Expert explanations on wrong answers', 'Challenge friends to beat your score'].map(tip => (
              <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', opacity: 0.9 }}>{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tips card */}
        <section style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Topic Ideas
            </h3>
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              'JavaScript Promises & async/await',
              'French Revolution — causes & effects',
              'Photosynthesis in C4 plants',
              'Machine Learning — overfitting & regularization',
              'React hooks — useState & useEffect',
              'World War II — key turning points',
            ].map(idea => (
              <button
                key={idea}
                onClick={() => setTopic(idea)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 12px',
                  background: 'none', border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 120ms ease',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BookOpen size={13} color="var(--accent)" style={{ flexShrink: 0, opacity: 0.7 }} />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{idea}</span>
                </div>
                <ChevronRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
