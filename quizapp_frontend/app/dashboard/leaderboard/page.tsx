"use client";

import React, { useState } from 'react';
import { useLeaderboard, useMyRank } from '@/hooks/social/useLeaderboard';
import { Skeleton } from '@/components/quiz-components';
import { useAuthStore } from '@/store/authStore';
import { Trophy, ArrowUp, ArrowDown, Minus, Medal, BarChart3, Star } from 'lucide-react';
import { clsx } from 'clsx';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'global' | 'friends' | 'weekly'>('global');
  const { data: leaderboard, isLoading } = useLeaderboard(tab);
  const { data: myRank, isLoading: isRankLoading } = useMyRank();
  const { user } = useAuthStore();

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  const getDelta = (id: string) => {
    const num = parseInt(id) || 0;
    const val = (num % 3);
    if (val === 0) return { val: (num % 4) + 1, up: true };
    if (val === 1) return { val: (num % 2) + 1, up: false };
    return { val: 0, up: null };
  };

  // Podium display order: [2nd, 1st, 3rd]
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumRanks = [2, 1, 3];
  const podiumHeights = ['h-32', 'h-48', 'h-24'];
  const podiumAvatarSizes = ['w-14 h-14', 'w-20 h-20', 'w-12 h-12'];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
            Leaderboards
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-tertiary)' }}>See how you stack up against the best.</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gap: '2px' }}>
          {(['global', 'friends', 'weekly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                minWidth: '80px',
                background: tab === t ? 'var(--bg-surface)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <section style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 24px 0',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '24px' }}>
                {podiumOrder.map((entry, i) => {
                  if (!entry) return null;
                  const rank = podiumRanks[i];
                  const isFirst = rank === 1;
                  return (
                    <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {isFirst && <Trophy size={28} color="var(--warn)" style={{ marginBottom: '8px', filter: 'drop-shadow(0 0 8px var(--warn))' }} />}
                      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                        <div style={{
                          width: isFirst ? '72px' : '52px',
                          height: isFirst ? '72px' : '52px',
                          borderRadius: '50%',
                          background: 'var(--bg-elevated)',
                          border: `2px solid ${isFirst ? 'var(--warn)' : rank === 2 ? 'var(--text-tertiary)' : 'var(--border-hi)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: isFirst ? '20px' : '15px',
                          color: 'var(--text-primary)',
                          margin: '0 auto 8px',
                          boxShadow: isFirst ? '0 0 20px var(--accent-subtle)' : 'none',
                        }}>
                          {entry.username.substring(0, 2).toUpperCase()}
                        </div>
                        <p style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.username}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{entry.avg_score}%</p>
                      </div>
                      <div style={{
                        width: isFirst ? '120px' : '90px',
                        height: isFirst ? '160px' : rank === 2 ? '120px' : '90px',
                        background: isFirst ? 'linear-gradient(to bottom, var(--accent-subtle), var(--bg-elevated))' : 'var(--bg-elevated)',
                        borderTop: `1px solid ${isFirst ? 'var(--accent)' : 'var(--border)'}`,
                        borderLeft: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: isFirst ? '40px' : '28px',
                        fontWeight: 800,
                        color: isFirst ? 'var(--warn)' : 'var(--text-muted)',
                      }}>
                        {rank}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>

            {/* Rankings list */}
            <section style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rankings
                </h3>
              </div>
              {others.length > 0 ? others.map((entry, idx) => {
                const isMe = entry.username === user?.username;
                const delta = getDelta(entry.id);
                return (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: isMe ? 'var(--success-subtle)' : 'transparent',
                    transition: 'background 120ms',
                  }}>
                    <span style={{ width: '24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>{idx + 4}</span>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                      background: isMe ? 'var(--success)' : 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 800, color: isMe ? '#fff' : 'var(--text-primary)',
                      flexShrink: 0,
                    }}>
                      {entry.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.username}</p>
                        {isMe && <span style={{ padding: '1px 6px', borderRadius: '999px', background: 'var(--success)', color: '#fff', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', flexShrink: 0 }}>You</span>}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{entry.total_quizzes} quizzes</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
                      {delta.up === true && <ArrowUp size={12} color="var(--success)" />}
                      {delta.up === false && <ArrowDown size={12} color="var(--danger)" />}
                      {delta.up === null && <Minus size={12} color="var(--text-muted)" />}
                      {delta.val !== 0 && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{delta.val}</span>}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '48px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{entry.avg_score}%</p>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                  No other rankings yet.
                </div>
              )}
            </section>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Your Ranking */}
              <section style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Medal size={14} color="var(--warn)" />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Ranking</h3>
                </div>
                <div style={{ padding: '32px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {isRankLoading ? (
                    <Skeleton className="h-16 w-24" />
                  ) : (
                    <>
                      <div style={{ fontSize: '56px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>
                        #{myRank?.rank || '--'}
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '6px', marginBottom: '24px' }}>Global Rank</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        {[
                          { label: 'Avg Score', value: `${myRank?.avg_score || 0}%` },
                          { label: 'Quizzes',   value: myRank?.total_quizzes || 0 },
                          { label: 'Streak',    value: '--' },
                        ].map((stat, i) => (
                          <div key={stat.label} style={{
                            textAlign: 'center', padding: '12px 8px',
                            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                          }}>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</p>
                            <p style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px' }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Top Subjects */}
              <section style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={14} color="var(--accent)" />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Subjects</h3>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {isRankLoading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)
                  ) : myRank?.top_subjects?.length ? (
                    myRank.top_subjects.map((s: any, i: number) => {
                      const colors = ['var(--success)', 'var(--accent)', 'var(--warn)'];
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{s.quiz__topic}</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: colors[i] || 'var(--accent)', flexShrink: 0 }}>{Math.round(s.avg_topic_score)}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.avg_topic_score}%`, background: colors[i] || 'var(--accent)', borderRadius: '999px', transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '32px 0', textAlign: 'center' }}>
                      <Star size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Take more quizzes to see stats!</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
