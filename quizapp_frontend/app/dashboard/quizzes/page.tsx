"use client";

import React, { useState } from 'react';
import { useQuizzes } from '@/hooks/api-hooks';
import { Button } from '@/components/ui-components';
import { Skeleton } from '@/components/quiz-components';
import { ChevronLeft, ChevronRight, Play, Plus, Share2, Layers } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Trash2 } from 'lucide-react';

/* ─── Difficulty chip ─── */
function DiffChip({ level }: { level: 'easy' | 'medium' | 'hard' }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    easy:   { bg: 'var(--success-subtle)', color: 'var(--success)', border: 'var(--success-border)' },
    medium: { bg: 'var(--warn-subtle)',    color: 'var(--warn)',    border: 'var(--warn-border)' },
    hard:   { bg: 'var(--danger-subtle)', color: 'var(--danger)',  border: 'var(--danger-border)' },
  };
  const s = map[level] || map.easy;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: '22px', padding: '0 9px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '99px', fontSize: '10.5px', fontWeight: 700,
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {level}
    </span>
  );
}

/* ─── Table row ─── */
function QuizRow({ quiz, onShare, onDelete }: { quiz: any; onShare: () => void; onDelete: () => void }) {
  const [hov, setHov] = React.useState(false);
  return (
    <tr
      style={{ background: hov ? 'var(--bg-elevated)' : 'transparent', transition: 'background 120ms' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
          {quiz.topic}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {new Date(quiz.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </td>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <DiffChip level={quiz.difficulty} />
      </td>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {quiz.num_questions}
        </span>
      </td>
      <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="outline" size="sm" onClick={onShare} style={{ width: '32px', padding: 0, justifyContent: 'center' }}>
            <Share2 size={13} />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} style={{ width: '32px', padding: 0, justifyContent: 'center', color: 'var(--danger)' }}>
            <Trash2 size={13} />
          </Button>
          <Link href={`/dashboard/quiz/${quiz.id}/take`}>
            <Button variant="primary" size="sm" style={{ gap: '6px' }}>
              <Play size={12} /> Start
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function QuizzesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, deleteQuiz } = useQuizzes(page);
  const [quizToDelete, setQuizToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  const th = (text: string, align?: 'center' | 'right') => (
    <th style={{
      padding: '12px 20px', fontSize: '10.5px', fontWeight: 700,
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
      textAlign: align || 'left', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
    }}>
      {text}
    </th>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '6px' }}>
            My Quizzes
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-tertiary)' }}>
            All your AI-generated learning challenges.
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button variant="primary" size="md" style={{ gap: '8px' }}>
            <Plus size={15} /> Generate New
          </Button>
        </Link>
      </div>

      {/* Table card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !data?.results?.length ? (
          <div style={{
            padding: '80px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          }}>
            <Layers size={36} color="var(--text-muted)" />
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>No quizzes yet</p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Generate your first AI quiz to get started.</p>
            <Link href="/dashboard/create" style={{ marginTop: '4px' }}>
              <Button variant="primary" size="sm" style={{ gap: '6px' }}>
                <Plus size={13} /> Generate Quiz
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '42%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
              <thead>
                <tr>
                  {th('Topic')}
                  {th('Difficulty')}
                  {th('Questions', 'center')}
                  {th('Actions', 'right')}
                </tr>
              </thead>
              <tbody>
                {data.results.map((quiz: any) => (
                  <QuizRow 
                    key={quiz.id} 
                    quiz={quiz} 
                    onShare={() => copyShareLink(quiz.share_token)} 
                    onDelete={() => setQuizToDelete(quiz)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog
          isOpen={!!quizToDelete}
          title="Delete Quiz"
          message={`Are you sure you want to delete "${quizToDelete?.topic}"? This action cannot be undone.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
          onConfirm={async () => {
            if (!quizToDelete) return;
            setIsDeleting(true);
            try {
              await deleteQuiz(quizToDelete.id);
              toast.success('Quiz deleted');
              setQuizToDelete(null);
            } catch (e) {
              toast.error('Failed to delete quiz');
            } finally {
              setIsDeleting(false);
            }
          }}
          onCancel={() => setQuizToDelete(null)}
        />

        {/* Pagination */}
        {data && data.count > 10 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{(page - 1) * 10 + 1}</strong>–
              <strong style={{ color: 'var(--text-primary)' }}>{Math.min(page * 10, data.count)}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{data.count}</strong>
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={15} />
              </Button>
              <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
