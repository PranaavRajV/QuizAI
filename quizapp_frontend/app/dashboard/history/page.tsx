"use client";

import React, { useState } from 'react';
import { useHistory } from '@/hooks/api-hooks';
import { Button } from '@/components/ui-components';
import { Skeleton } from '@/components/quiz-components';
import { ChevronLeft, ChevronRight, Eye, Play, Filter, ArrowUpDown, ClipboardList, Calendar, Target } from 'lucide-react';
import Link from 'next/link';

/* ─── Score badge ─── */
function ScoreBadge({ score }: { score: number }) {
  const isHigh = score >= 85;
  const isMid = score >= 60;
  
  const colors = {
    high: { bg: 'var(--success-subtle)', text: 'var(--success)', border: 'var(--success-border)' },
    mid: { bg: 'var(--warn-subtle)', text: 'var(--warn)', border: 'var(--warn-border)' },
    low: { bg: 'var(--danger-subtle)', text: 'var(--danger)', border: 'var(--danger-border)' }
  };

  const current = isHigh ? colors.high : isMid ? colors.mid : colors.low;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '54px', padding: '4px 10px',
      background: current.bg, color: current.text, border: `1px solid ${current.border}`,
      borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 800,
    }}>
      {Math.round(score)}%
    </span>
  );
}

/* ─── Table row ─── */
function AttemptRow({ attempt }: { attempt: any }) {
  const [hov, setHov] = React.useState(false);
  const dt = new Date(attempt.started_at);
  
  return (
    <tr
      style={{ 
        background: hov ? 'var(--bg-elevated)' : 'transparent', 
        transition: 'background 120ms ease',
        cursor: 'default'
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {attempt.quiz_topic}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Target size={12} /> {attempt.total_questions} Questions
             </span>
          </div>
        </div>
      </td>
      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <ScoreBadge score={attempt.score} />
      </td>
      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
           <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Calendar size={12} style={{ opacity: 0.6 }} />
             {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
           </p>
           <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '18px' }}>
             {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </p>
        </div>
      </td>
      <td style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Link href={`/dashboard/quiz/${attempt.quiz}/results/${attempt.id}`}>
            <Button variant="outline" size="sm" style={{ gap: '6px', fontSize: '12px' }}>
              <Eye size={14} /> Review
            </Button>
          </Link>
          <Link href={`/dashboard/quiz/${attempt.quiz}/take`}>
            <Button variant="primary" size="sm" style={{ gap: '6px', fontSize: '12px' }}>
              <Play size={14} /> Retake
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useHistory(page);
  const results = data?.results || [];

  const th = (text: string, align?: 'center' | 'right') => (
    <th style={{
      padding: '12px 20px', fontSize: '11px', fontWeight: 700,
      color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em',
      textAlign: align || 'left', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
    }}>
      {text}
    </th>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
            History
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-tertiary)' }}>
            Insights and performance data from your past quiz attempts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="md" style={{ gap: '8px' }}>
            <Filter size={16} /> Filter
          </Button>
          <Button variant="outline" size="md" style={{ gap: '8px' }}>
            <ArrowUpDown size={16} /> Sort
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : results.length === 0 ? (
          <div style={{
            padding: '100px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{ 
               width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-elevated)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
            }}>
               <ClipboardList size={32} />
            </div>
            <div>
               <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No records found</h3>
               <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>You haven't taken any quizzes yet. Your progress will appear here.</p>
            </div>
            <Link href="/dashboard/create" style={{ marginTop: '12px' }}>
              <Button variant="primary" size="md">Generate Your First Quiz</Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '700px' }}>
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr>
                  {th('Topic')}
                  {th('Score', 'center')}
                  {th('Date')}
                  {th('Actions', 'right')}
                </tr>
              </thead>
              <tbody>
                {results.map((attempt: any) => (
                  <AttemptRow key={attempt.id} attempt={attempt} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.count > 10 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{(page - 1) * 10 + 1}</span>–
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{Math.min(page * 10, data.count)}</span> of{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{data.count}</span> results
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <ChevronLeft size={18} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!data.next} 
                onClick={() => setPage(p => p + 1)}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
