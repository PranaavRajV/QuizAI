"use client";

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warn';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Trap focus to confirm button on open; close on Escape
  useEffect(() => {
    if (!isOpen) return;
    confirmRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const accentColor = variant === 'danger' ? 'var(--danger)' : 'var(--warn)';
  const accentBg = variant === 'danger' ? 'var(--danger-subtle)' : 'var(--warn-subtle)';
  const accentBorder = variant === 'danger' ? 'var(--danger-border)' : 'var(--warn-border)';

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(4px)',
        animation: 'fade-in 0.15s ease',
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${accentBorder}`,
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          animation: 'slide-up 0.2s ease',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            flexShrink: 0, width: '40px', height: '40px',
            borderRadius: '50%', background: accentBg,
            border: `1px solid ${accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={18} color={accentColor} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 id="confirm-dialog-title" style={{
              fontSize: '15px', fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: '6px',
            }}>
              {title}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {message}
            </p>
          </div>
          <button
            aria-label="Close dialog"
            onClick={onCancel}
            style={{
              flexShrink: 0, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13.5px', fontWeight: 600,
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              background: accentColor,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '13.5px', fontWeight: 700,
              color: '#fff', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: `0 4px 12px ${accentBg}`,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
