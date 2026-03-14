"use client";

import React from 'react';
import { useAnalytics } from '@/hooks/api-hooks';
import { Skeleton } from '@/components/quiz-components';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Award, Target, Hash, AlertCircle } from 'lucide-react';

/* ─── tiny reusable stat tile ─── */
function StatTile({
  label, value, icon, trendUp,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trendUp?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
          {label}
        </p>
        <p style={{
          fontSize: '22px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: trendUp === undefined
            ? 'var(--text-primary)'
            : trendUp ? 'var(--success)' : 'var(--danger)',
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── topic row ─── */
function TopicRow({ topic, attempts, score, accent }: { topic: string; attempts: number; score: number; accent: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '14px 20px',
      gap: '14px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 120ms ease',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {topic}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>
          {score}%
        </p>
        <div style={{ width: '72px', height: '4px', background: 'var(--bg-active)', borderRadius: '99px', marginTop: '4px' }}>
          <div style={{ height: '100%', width: `${score}%`, background: accent, borderRadius: '99px', transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
}

/* ─── panel card ─── */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '13px 20px',
        borderBottom: '1px solid var(--border)',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-md)',
  },
  itemStyle: { color: 'var(--text-primary)' },
  labelStyle: { color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px' },
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );

  if (error || !analytics) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '12px', padding: '80px 20px', color: 'var(--danger)',
    }}>
      <AlertCircle size={32} />
      <p style={{ fontSize: '14px', fontWeight: 600 }}>Failed to load analytics data.</p>
    </div>
  );

  const avgScore = Math.round(
    analytics.topics.reduce((a: any, b: any) => a + b.avg_score, 0) / (analytics.topics.length || 1)
  );
  const totalAttempts = analytics.topics.reduce((a: any, b: any) => a + b.attempts, 0);
  const sorted = [...analytics.topics].sort((a, b) => b.avg_score - a.avg_score);
  const best = sorted.slice(0, 4);
  const worst = sorted.slice(-4).reverse();

  const diffData = [
    { name: 'Easy',   value: analytics.performance_by_difficulty.easy,   color: '#10b981' },
    { name: 'Medium', value: analytics.performance_by_difficulty.medium,  color: '#f59e0b' },
    { name: 'Hard',   value: analytics.performance_by_difficulty.hard,    color: '#ef4444' },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '6px' }}>
          Performance Analytics
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-tertiary)' }}>
          Visualize your learning progress over time.
        </p>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <StatTile label="Avg Score"    value={`${avgScore}%`}                                     icon={<Award size={18} color="var(--accent)" />} />
        <StatTile label="Total Quizzes" value={String(totalAttempts)}                              icon={<Hash size={18} color="var(--accent)" />} />
        <StatTile label="Success Rate"  value={`${Math.round(analytics.success_rate)}%`}           icon={<Target size={18} color="var(--accent)" />} />
        <StatTile
          label="Trend"
          value={`${analytics.trend >= 0 ? '+' : ''}${analytics.trend}%`}
          icon={<TrendingUp size={18} color="var(--accent)" />}
          trendUp={analytics.trend >= 0}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <Panel title="Score Trend — Last 30 Days">
          <div style={{ padding: '20px', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.scores_over_time}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10}
                  tickFormatter={(v) => v.split('-').slice(1).join('/')} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5}
                  dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Performance by Difficulty">
          <div style={{ padding: '20px', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diffData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} {...CHART_TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {diffData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Topics breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Panel title="Strengths — Best Topics">
          <div>
            {best.length ? best.map((item, idx) => (
              <TopicRow key={idx} topic={item.topic} attempts={item.attempts} score={item.avg_score} accent="var(--success)" />
            )) : (
              <p style={{ padding: '32px 20px', textAlign: 'center', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                No data yet — take some quizzes!
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Focus Areas — Needs Improvement">
          <div>
            {worst.length ? worst.map((item, idx) => (
              <TopicRow key={idx} topic={item.topic} attempts={item.attempts} score={item.avg_score} accent="var(--danger)" />
            )) : (
              <p style={{ padding: '32px 20px', textAlign: 'center', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                No data yet.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
