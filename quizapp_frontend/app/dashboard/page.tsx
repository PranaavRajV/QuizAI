"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useQuizzes, useAnalytics, useNotifications } from '@/hooks/api-hooks';
import { 
  Plus, Play, Award, Target, TrendingUp, Clock, 
  ArrowRight, Sparkles, BookOpen, ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { Button, StatCard, DifficultyBadge } from '@/components/ui-components';
import { Skeleton } from '@/components/quiz-components';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzes(1);
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: notifications } = useNotifications();

  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const displayName = user?.username || user?.email?.split('@')[0] || 'Explorer';
  const recentQuizzes = quizzes?.results?.slice(0, 5) || [];
  const activities = notifications?.recent_activity?.slice(0, 5) || [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      
      {/* ── Welcome Header ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', 
            letterSpacing: '-0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' 
          }}>
            {greeting}, {displayName} <Sparkles size={24} color="var(--warn)" style={{ opacity: 0.8 }} />
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-tertiary)' }}>
            You've mastered <strong style={{ color: 'var(--text-secondary)' }}>{analytics?.success_rate || 0}%</strong> of your quizzes this week. Keep it up!
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button variant="primary" size="lg" style={{ gap: '8px', boxShadow: '0 4px 14px var(--accent-subtle)' }}>
            <Plus size={18} /> Generate New Quiz
          </Button>
        </Link>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard 
          label="Avg Score" 
          value={`${analytics?.performance_by_difficulty ? Math.round((Object.values(analytics.performance_by_difficulty) as number[]).reduce((a:number,b:number)=>a+b,0) / 3) : 0}%`}
          sub="Last 30 days"
          icon={<Award size={18} />}
          accent="var(--accent)"
        />
        <StatCard 
          label="Quizzes Taken" 
          value={analytics?.total_quizzes || 0} 
          sub="Total attempts"
          icon={<BookOpen size={18} />}
        />
        <StatCard 
          label="Best Topic" 
          value={analytics?.topics?.[0]?.topic || 'N/A'} 
          sub={analytics?.topics?.[0] ? `${analytics.topics[0].avg_score}% avg` : 'No data yet'}
          icon={<Target size={18} />}
          accent="var(--success)"
        />
        <StatCard 
          label="Learning Trend" 
          value={`${analytics?.trend >= 0 ? '+' : ''}${analytics?.trend || 0}%`} 
          sub="Vs previous week"
          icon={<TrendingUp size={18} />}
          accent="var(--warn)"
        />
      </div>

      {/* ── Main Content Split ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }}>
        
        {/* Left: Recent Quizzes Table */}
        <section style={{ 
          background: 'var(--bg-surface)', border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '16px 20px', borderBottom: '1px solid var(--border)', 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Quizzes
            </h3>
            <Link href="/dashboard/quizzes" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ flex: 1 }}>
            {quizzesLoading ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentQuizzes.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--bg-elevated)' }}>
                    <th style={{ padding: '10px 20px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOPIC</th>
                    <th style={{ padding: '10px 20px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DIFFICULTY</th>
                    <th style={{ padding: '10px 20px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuizzes.map((quiz: any) => (
                    <tr key={quiz.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 120ms' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{quiz.topic}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{quiz.num_questions} Questions</p>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <DifficultyBadge level={quiz.difficulty} />
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <Link href={`/dashboard/quiz/${quiz.id}/take`}>
                          <Button variant="outline" size="sm" style={{ gap: '6px' }}>
                            <Play size={12} /> Start
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <BookOpen size={32} color="var(--text-muted)" style={{ marginBottom: '12px', margin: '0 auto' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>No quizzes generated yet</p>
                <Link href="/dashboard/create" style={{ display: 'inline-block', marginTop: '12px' }}>
                  <Button variant="outline" size="sm">Create your first quiz</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Right: Activity & Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Actions Card */}
          <section style={{ 
            background: 'var(--accent)', color: '#fff', 
            borderRadius: 'var(--radius-lg)', padding: '20px',
            boxShadow: '0 8px 24px var(--accent-subtle)',
            position: 'relative', overflow: 'hidden'
          }}>
            <Sparkles size={120} style={{ position: 'absolute', top: '-40px', right: '-40px', opacity: 0.1, color: '#fff' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Pro Tip</h4>
            <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.5, marginBottom: '16px' }}>
              Practice hard-difficulty quizzes to boost your learning trend and unlock premium badges.
            </p>
            <Link href="/dashboard/analytics">
              <Button variant="secondary" size="sm" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', gap: '6px' }}>
                View detailed stats <ChevronRight size={14} />
              </Button>
            </Link>
          </section>

          {/* Activity Feed */}
          <section style={{ 
            background: 'var(--bg-surface)', border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recent Activity
              </h3>
            </div>
            <div style={{ padding: '10px 0' }}>
              {activities.length > 0 ? activities.map((act: any, idx: number) => (
                <div key={idx} style={{ 
                  display: 'flex', gap: '12px', padding: '12px 20px', 
                  borderBottom: idx === activities.length - 1 ? 'none' : '1px solid var(--border)',
                  transition: 'background 120ms'
                }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: 'var(--radius-md)', 
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Clock size={14} color="var(--text-tertiary)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                      {act.message}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No recent activity</p>
                </div>
              )}
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
