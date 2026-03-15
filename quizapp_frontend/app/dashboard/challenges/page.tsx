"use client";

import React, { useState } from 'react';
import { useChallenges } from '@/hooks/social/useChallenges';
import { useFriends } from '@/hooks/social/useFriends';
import { Button } from '@/components/ui-components';
import { Skeleton } from '@/components/quiz-components';
import { Sword, Send, History, Clock, Trophy, Frown, Info } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

function ChallengesContent() {
  const [tab, setTab] = useState<'active' | 'sent' | 'history'>('active');
  const { challenges, isLoading, sendChallenge, acceptChallenge } = useChallenges();
  const { friends } = useFriends();
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendIdFromUrl = searchParams.get('friendId');

  const [selectedFriend, setSelectedFriend] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState(5);

  // Pre-select friend if coming from Friends page
  React.useEffect(() => {
    if (friendIdFromUrl && friends.length > 0) {
      const exists = friends.some(f => String(f.id) === friendIdFromUrl);
      if (exists) {
        setSelectedFriend(friendIdFromUrl);
        setTab('sent'); // Switch to "Sent" tab as we're about to send one
      }
    }
  }, [friendIdFromUrl, friends]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend || !topic) return;
    await sendChallenge({ challenged_user_id: selectedFriend, topic, difficulty, num_questions: questions });
    setTopic('');
    setSelectedFriend('');
  };

  const handleAccept = async (id: number) => {
    const data = await acceptChallenge(id);
    if (data?.quiz_id) {
      if (data.attempt_id) {
        localStorage.setItem('current_attempt_' + data.quiz_id, data.attempt_id.toString());
      }
      router.push(`/dashboard/quiz/${data.quiz_id}/take`);
    }
  };

  const filtered = challenges.filter(c => {
    const isChallenger = c.challenger_detail.username === user?.username;
    if (tab === 'sent')   return isChallenger && c.status === 'pending';
    if (tab === 'active') return (!isChallenger && c.status === 'pending') || c.status === 'active';
    return c.status === 'completed' || c.status === 'expired';
  });

  const tabs = [
    { id: 'active',  label: 'Received', icon: <Clock size={13} /> },
    { id: 'sent',    label: 'Sent',     icon: <Send size={13} /> },
    { id: 'history', label: 'History',  icon: <History size={13} /> },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '40px', padding: '0 13px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
    fontSize: '13.5px', color: 'var(--text-primary)', outline: 'none',
    appearance: 'none' as any,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
            Challenges
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-tertiary)' }}>Duel your friends in head-to-head battles.</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gap: '2px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              style={{
                padding: '6px 18px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                transition: 'all 120ms ease',
                display: 'flex', alignItems: 'center', gap: '6px',
                background: tab === t.id ? 'var(--bg-surface)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Challenge list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)
          ) : filtered.length > 0 ? (
            filtered.map(challenge => {
              const isChallenger = challenge.challenger_detail.username === user?.username;
              const opponent = isChallenger ? challenge.challenged_detail : challenge.challenger_detail;

              return (
                <section key={challenge.id} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  transition: 'border-color 120ms',
                }}>
                  {/* Accent bar for incoming pending */}
                  {challenge.status === 'pending' && !isChallenger && (
                    <div style={{ height: '2px', background: 'linear-gradient(to right, var(--danger), transparent)' }} />
                  )}
                  <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 800, color: 'var(--danger)', flexShrink: 0,
                      }}>
                        {opponent.avatar_initials}
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                          VS {opponent.username}
                        </p>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{challenge.quiz_detail.topic}</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                          }}>
                            {challenge.quiz_detail.difficulty}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {challenge.quiz_detail.num_questions} Questions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {challenge.status === 'pending' && !isChallenger ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="outline" size="sm">Decline</Button>
                          <Button variant="danger" size="sm" onClick={() => handleAccept(challenge.id)}>Accept ⚔️</Button>
                        </div>
                      ) : challenge.status === 'pending' && isChallenger ? (
                        <span style={{ padding: '5px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1px solid var(--border)' }}>
                          Awaiting response
                        </span>
                      ) : challenge.status === 'active' ? (
                        <Button variant="success" size="sm" onClick={() => handleAccept(challenge.id)}>Resume ▶</Button>
                      ) : challenge.status === 'completed' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>Result</p>
                            {challenge.winner_name === user?.username ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 800, fontSize: '12px' }}>
                                <Trophy size={13} /> Victory
                              </div>
                            ) : challenge.winner_name ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontWeight: 800, fontSize: '12px' }}>
                                <Frown size={13} /> Defeat
                              </div>
                            ) : (
                              <div style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '12px' }}>Draw</div>
                            )}
                          </div>
                          <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {challenge.challenger_attempt_detail?.score}% – {challenge.challenged_attempt_detail?.score}%
                            </p>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Scoreboard</p>
                          </div>
                        </div>
                      ) : (
                        <span style={{ padding: '5px 12px', borderRadius: 'var(--radius-md)', background: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger-border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              );
            })
          ) : (
            <section style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '80px 40px', textAlign: 'center',
            }}>
              <Sword size={36} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>The arena is empty</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                You haven't received or sent any challenges yet. Pick a friend and send your first battle request!
              </p>
              <Button onClick={() => setTab('sent')} variant="primary" size="md" style={{ gap: '8px' }}>
                <Sword size={14} /> Send a Challenge
              </Button>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Launch panel */}
          <section style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sword size={14} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Launch a Challenge</h3>
            </div>

            <form style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }} onSubmit={handleSend}>
              <div>
                <label style={labelStyle}>Opponent</label>
                <select style={inputStyle} value={selectedFriend} onChange={e => setSelectedFriend(e.target.value)} required>
                  <option value="">Choose a friend...</option>
                  {friends.map(f => <option key={f.id} value={f.id}>{f.username}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Quiz Topic</label>
                <input
                  type="text" placeholder="e.g. JavaScript Patterns"
                  style={{ ...inputStyle }}
                  value={topic} onChange={e => setTopic(e.target.value)} required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 3 }}>
                  <label style={labelStyle}>Difficulty</label>
                  <select style={inputStyle} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Questions</label>
                  <input type="number" min="5" max="20" style={inputStyle} value={questions} onChange={e => setQuestions(parseInt(e.target.value))} />
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" style={{ width: '100%', gap: '8px', marginTop: '4px' }}>
                <Sword size={14} /> Send Challenge
              </Button>
            </form>
          </section>

          {/* Info card */}
          <section style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
            display: 'flex', gap: '14px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-active)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Info size={14} color="var(--text-secondary)" />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Same Quiz, Fair Play</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Both you and your opponent will attempt the exact same AI-generated questions to ensure a fair competition.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <ChallengesContent />
    </React.Suspense>
  );
}
