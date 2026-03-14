"use client";

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      gap: '0',
    }}>
      {/* Icon */}
      <div style={{
        width: '64px', height: '64px',
        borderRadius: '50%',
        background: 'var(--danger-subtle)',
        border: '1px solid var(--danger-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px',
      }}>
        <AlertTriangle size={28} color="var(--danger)" />
      </div>

      <h1 style={{
        fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em',
        color: 'var(--text-primary)', marginBottom: '10px',
      }}>
        Something went wrong
      </h1>
      <p style={{
        fontSize: '14px', color: 'var(--text-muted)',
        maxWidth: '380px', lineHeight: 1.6, marginBottom: '32px',
      }}>
        An unexpected error occurred. We've been notified and are working on it.
        {error?.digest && (
          <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', opacity: 0.6 }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 22px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            boxShadow: '0 4px 14px var(--accent-subtle)',
          }}
        >
          <RefreshCcw size={15} /> Try Again
        </button>

        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 22px',
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600, fontSize: '14px',
          textDecoration: 'none',
        }}>
          <Home size={15} /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
