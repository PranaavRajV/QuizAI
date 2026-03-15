"use client";

import { useRouter, useParams } from 'next/navigation';
import { useAttempt, useQuiz } from '@/hooks/api-hooks';
import { Button } from '@/components/ui-components';
import { CircularScore } from '@/components/quiz-components';
import { 
  CheckCircle2, XCircle, RotateCcw, Plus, 
  History as HistoryIcon, ArrowLeft, Users, 
  HelpCircle, ChevronDown, ChevronUp, Share2, Sparkles,
  Trophy, Medal, Target, Clock, MessageSquare
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useFriends } from '@/hooks/social/useFriends';
import ShareMenu from '@/components/ShareMenu';
import ShareModal from '@/components/ShareModal';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function ResultsPage() {
  const router = useRouter();
  const { id, attemptId } = useParams() as { id: string, attemptId: string };
  const { data: result, isLoading: resultLoading, refetch } = useAttempt(attemptId);
  const { friends } = useFriends();
  
  // Polling logic for async evaluation
  React.useEffect(() => {
    if (result && result.evaluation_status === 'processing') {
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [result, refetch]);

  const [showShare, setShowShare] = useState(false);
  const [shareMode, setShareMode] = useState<'share' | 'challenge'>('share');
  const resultCardRef = useRef<HTMLDivElement>(null!);

  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  // Auto-expand wrong answers on load
  React.useEffect(() => {
    if (result?.quiz_details && result?.answers) {
      const newExpanded: Record<number, boolean> = {};
      result.quiz_details.forEach(q => {
        const ans = result.answers?.find(a => a.question === q.id);
        if (ans && !ans.is_correct && result.evaluation_status === 'completed') {
          newExpanded[q.id] = true;
        }
      });
      setExpandedQuestions(newExpanded);
    }
  }, [result]);

  const toggleExpand = (questionId: number) => {
    setExpandedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  if (resultLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
        <div className="qs-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'qs-spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Analyzing your performance...</p>
      </div>
    );
  }

  if (!result || !result.quiz_details) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Results not found</h3>
        <Button variant="outline" style={{ marginTop: '20px' }} onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const scoreMessage = () => {
    if (result.score >= 90) return { title: "Master Class!", desc: "You've absolutely nailed it. A perfect demonstration of knowledge.", icon: <Trophy color="var(--warn)" size={48} /> };
    if (result.score >= 70) return { title: "Excellent Work!", desc: "You've shown a strong grasp of the material. Keep it up!", icon: <Medal color="var(--accent)" size={48} /> };
    if (result.score >= 50) return { title: "Good Progress!", desc: "A solid performance. You're getting there!", icon: <Target color="var(--success)" size={48} /> };
    return { title: "Keep Pushing!", desc: "Consistency is key. Every attempt makes you stronger.", icon: <Sparkles color="var(--text-muted)" size={48} /> };
  };

  const msg = scoreMessage();

  return (
    <div ref={resultCardRef} style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '80px' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/history')} style={{ gap: '6px', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> History
        </Button>
        <div style={{ display: 'flex', gap: '12px' }}>
           <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/quiz/${id}/take`)} style={{ gap: '8px' }}>
             <RotateCcw size={14} /> Retake
           </Button>
           <ShareMenu 
             quizTopic={result.quiz_topic}
             score={result.score}
             attemptId={attemptId}
             onOpenFriends={() => { setShareMode('share'); setShowShare(true); }}
             onOpenChallenge={() => { setShareMode('challenge'); setShowShare(true); }}
             resultCardRef={resultCardRef}
           />
        </div>
      </div>

      {/* ── Summary Card ── */}
      <section style={{ 
        background: 'var(--bg-surface)', border: '1px solid var(--border)', 
        borderRadius: 'var(--radius-lg)', padding: '54px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        gap: '32px', position: 'relative', overflow: 'hidden'
      }}>
         <div style={{ position: 'absolute', top: '-40px', right: '-40px', opacity: 0.05 }}>
            {msg.icon}
         </div>
         
         <CircularScore score={result.score} size={180} />
         
         <div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '8px' }}>
              {msg.title}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-tertiary)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
              {msg.desc}
            </p>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', width: '100%', maxWidth: '500px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
            <div>
               <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{result.correct_count}/{result.total_questions}</p>
               <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Correct</p>
            </div>
            <div>
               <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>{Math.round((result.total_questions - result.correct_count))}</p>
               <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Missed</p>
            </div>
            <div>
               <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>--</p>
               <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Time</p>
            </div>
         </div>
      </section>

      {/* ── Social Comparison ── */}
      <section>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Users size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Social Comparison</h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
         </div>

         <div style={{ 
            background: 'var(--bg-surface)', border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-lg)', overflow: 'hidden' 
         }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {/* Current User Row */}
               <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 'var(--radius-md)', 
                  background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)'
               }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', 
                        color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                     }}>ME</div>
                     <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>You (Current Attempt)</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent)' }}>{Math.round(result.score)}%</span>
               </div>

               {/* Friends Rows (Mocked for context) */}
               {friends.length > 0 ? friends.slice(0, 3).map((friend, i) => {
                  const mockScores = [88, 72, 64];
                  const score = mockScores[i] || 60;
                  return (
                     <div key={friend.id} style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none'
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', 
                              color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '1px solid var(--border)'
                           }}>{friend.avatar_initials}</div>
                           <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{friend.username}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '120px', height: '5px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden', display: 'none' }}>
                               <div style={{ height: '100%', width: `${score}%`, background: 'var(--text-muted)', borderRadius: '99px' }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-tertiary)' }}>{score}%</span>
                        </div>
                     </div>
                  );
               }) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                     <MessageSquare size={32} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                     <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No friends have attempted this quiz yet.</p>
                     <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/friends')}>Invite Friends</Button>
                  </div>
               )}
            </div>
         </div>
      </section>

      {/* ── Answer Review ── */}
      <section>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <HelpCircle size={18} color="var(--warn)" />
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Answer Review</h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)' }}>
               {result.correct_count} CORRECT
            </span>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.quiz_details?.map((question, idx) => {
               const userAnswer = result.answers?.find(a => a.question === question.id);
               const isCorrect = userAnswer?.is_correct;
               const selectedChoice = question.choices.find(c => c.id === userAnswer?.selected_choice);
               const correctChoice = question.choices.find(c => (c as any).is_correct);
               const isExpanded = expandedQuestions[question.id];

               return (
                  <div key={question.id} style={{ 
                     background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                     borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                     borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                     transition: 'transform 150ms ease'
                  }}>
                     <div 
                        onClick={() => toggleExpand(question.id)}
                        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}
                     >
                        <div style={{ display: 'flex', gap: '16px' }}>
                           <div style={{ 
                              width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', 
                              background: isCorrect ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                              color: isCorrect ? 'var(--success)' : 'var(--danger)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 800, flexShrink: 0
                           }}>{idx + 1}</div>
                           <div>
                              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>{question.question_text}</h4>
                              <p style={{ fontSize: '13px', color: isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginTop: '6px' }}>
                                 {isCorrect ? 'Correct Answer' : (question.type === 'typed' && result.evaluation_status === 'processing') ? 'Evaluating...' : 'Incorrect Answer'}
                              </p>
                           </div>
                        </div>
                        <div style={{ color: 'var(--text-muted)', paddingTop: '4px' }}>
                           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                     </div>

                     {isExpanded && (
                        <div style={{ padding: '0 24px 24px 68px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                              <div style={{ 
                                padding: '12px 16px', 
                                borderRadius: 'var(--radius-md)', 
                                background: isCorrect ? 'var(--success-subtle)' : (question.type === 'typed' && result.evaluation_status === 'processing') ? 'var(--bg-elevated)' : 'var(--danger-subtle)', 
                                border: '1px solid transparent' 
                              }}>
                                 <p style={{ fontSize: '10px', fontWeight: 800, color: isCorrect ? 'var(--success)' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Your Response</p>
                                 <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                   {question.type === 'typed' ? (userAnswer?.typed_answer || "No response") : (selectedChoice?.choice_text || "Skipped")}
                                 </p>
                              </div>
                              {(!isCorrect && result.evaluation_status === 'completed') && (
                                 <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--success-subtle)', border: '1px solid transparent' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '4px' }}>Correct Answer</p>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {question.type === 'typed' ? question.correct_answer : correctChoice?.choice_text}
                                    </p>
                                 </div>
                              )}
                           </div>

                           <div style={{ 
                              padding: '20px', borderRadius: 'var(--radius-md)', 
                              background: 'var(--bg-elevated)', border: '1px solid var(--border)', 
                              position: 'relative', overflow: 'hidden'
                           }}>
                              {/* Background Decoration */}
                              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                                 <Sparkles size={60} color="var(--accent)" />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                 <div style={{ 
                                    width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
                                 }}>
                                    <Sparkles size={12} />
                                 </div>
                                 <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    AI Expert Analysis
                                 </p>
                              </div>

                              <div style={{ position: 'relative', zIndex: 1 }}>
                                 <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>
                                    {result.evaluation_status === 'processing' ? (
                                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Evaluating your response with AI...</span>
                                    ) : (
                                      <>
                                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                                          The correct answer is "{question.type === 'typed' ? question.correct_answer : correctChoice?.choice_text}".
                                        </span>{' '}
                                        {userAnswer?.feedback || question.explanation || "No further details provided by the AI for this question."}
                                      </>
                                    )}
                                 </p>
                                 
                                 {!isCorrect && (
                                    <div style={{ 
                                       marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)',
                                       display: 'flex', gap: '10px', alignItems: 'flex-start'
                                    }}>
                                       <Target size={14} color="var(--danger)" style={{ marginTop: '3px' }} />
                                       <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                          Pro-tip: Focus on why "{selectedChoice?.choice_text || 'skipping'}" was incorrect compared to the reasoning above.
                                       </p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </section>

      {/* ── Results Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
         <Button variant="outline" size="md" onClick={() => router.push('/dashboard')} style={{ gap: '8px' }}>
            <ArrowLeft size={16} /> Dashboard
         </Button>
         <Button 
            variant="outline" 
            size="md" 
            style={{ gap: '8px', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            onClick={async () => {
              try {
                const resp = await api.post(`/api/quizzes/${id}/share/`);
                const url = `${window.location.origin}/quiz/play/${resp.data.share_token}`;
                navigator.clipboard.writeText(url);
                toast.success('Public play link copied!');
              } catch (e) {
                toast.error('Failed to share publicly');
              }
            }}
         >
            <Share2 size={16} /> Share Publicly
         </Button>
         <Button variant="primary" size="md" onClick={() => router.push('/dashboard/create')} style={{ gap: '8px' }}>
            <Plus size={16} /> New Quiz
         </Button>
      </div>

      {showShare && (
        <ShareModal 
          attemptId={attemptId}
          quizName={result.quiz_topic}
          score={result.score}
          initialMode={shareMode}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
