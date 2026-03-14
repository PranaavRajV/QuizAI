"use client";

import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

// This catches crashes in the root layout itself (e.g., Providers failing)
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        margin: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
        background: '#09090b',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '40px',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '8px',
        }}>
          <AlertTriangle size={28} color="#ef4444" />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Application Error
        </h1>
        <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '400px', lineHeight: 1.6, margin: 0 }}>
          A critical error occurred and the app could not be loaded. This is usually a temporary issue.
          {error?.digest && (
            <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', opacity: 0.6 }}>
              ID: {error.digest}
            </span>
          )}
        </p>

        <button
          onClick={reset}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          <RefreshCcw size={15} /> Reload App
        </button>
      </body>
    </html>
  );
}
