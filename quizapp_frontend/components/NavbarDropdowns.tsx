"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications, useSearchQuizzes } from '@/hooks/api-hooks';
import { useAuthStore } from '@/store/authStore';
import { Search, Bell, Users, Swords, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Shared dropdown shell ─── */
function Dropdown({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      zIndex: 100,
      overflow: 'hidden',
      animation: 'slide-up 0.18s var(--ease) both',
      ...style,
    }} className={className}>
      {children}
    </div>
  );
}

/* ─── Icon button ─── */
function IconBtn({
  children, onClick, active, badge,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '32px', height: '32px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid',
        borderColor: active || hov ? 'var(--border-mid)' : 'var(--border)',
        background: active ? 'var(--bg-elevated)' : hov ? 'var(--bg-hover)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: active || hov ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'all 120ms ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: '-5px', right: '-5px',
          width: '16px', height: '16px',
          background: 'var(--accent)',
          color: '#fff',
          fontSize: '9px', fontWeight: 800,
          borderRadius: '99px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg-base)',
          lineHeight: 1,
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

/* ─── Search ─── */
export function SearchDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, isLoading } = useSearchQuizzes(query);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <IconBtn onClick={() => setIsOpen(v => !v)} active={isOpen}>
        <Search size={14} />
      </IconBtn>

      {isOpen && (
        <Dropdown style={{ width: '340px' }}>
          {/* Search input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
          }}>
            <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search quizzes…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: '13px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Results */}
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={18} style={{ animation: 'qs-spin 0.65s linear infinite', color: 'var(--text-muted)' }} />
              </div>
            ) : query.length < 2 ? (
              <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                Type at least 2 characters…
              </p>
            ) : results.length > 0 ? (
              results.map(quiz => (
                <Link
                  key={quiz.id}
                  href={`/dashboard/quiz/${quiz.id}/take`}
                  onClick={() => { setIsOpen(false); setQuery(''); }}
                >
                  <div style={{
                    padding: '11px 14px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {quiz.topic}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={clsx('chip', quiz.difficulty === 'easy' ? 'chip-success' : quiz.difficulty === 'medium' ? 'chip-warn' : 'chip-danger')}>
                        {quiz.difficulty}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {quiz.num_questions} questions
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                No quizzes found for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </Dropdown>
      )}
    </div>
  );
}

/* ─── Notifications ─── */
export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const { data: notifications, markAllAsRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  const unreadCount = user?.notifications_unread || 0;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <IconBtn onClick={() => setIsOpen(v => !v)} active={isOpen} badge={unreadCount}>
        <Bell size={14} />
      </IconBtn>

      {isOpen && (
        <Dropdown style={{ width: '320px' }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  fontSize: '11px', color: 'var(--accent)', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {!Array.isArray(notifications) || notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Bell size={24} color="var(--border-hi)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n: any) => {
                const href = n.type === 'friend_request' ? '/dashboard/friends' 
                            : n.type === 'challenge_received' ? '/dashboard/challenges'
                            : n.type === 'challenge_completed' ? '/dashboard/challenges'
                            : undefined;
                
                const content = (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid var(--border)',
                      background: n.is_read ? 'transparent' : 'var(--accent-subtle)',
                      transition: 'background 120ms ease',
                      cursor: href ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--accent-subtle)')}
                  >
                    <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );

                if (href) {
                  return (
                    <Link key={n.id} href={href} onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
                      {content}
                    </Link>
                  );
                }

                return <div key={n.id}>{content}</div>;
              })
            )}
          </div>

          <Link href="/dashboard/history" onClick={() => setIsOpen(false)}>
            <div style={{
              padding: '12px', textAlign: 'center', fontSize: '11.5px', fontWeight: 600,
              color: 'var(--text-secondary)', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)',
            }}>
              VIEW ALL ACTIVITY
            </div>
          </Link>
        </Dropdown>
      )}
    </div>
  );
}
