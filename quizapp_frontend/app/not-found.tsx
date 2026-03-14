"use client";

import Link from 'next/link';
import { Frown, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base, #09090b)',
      color: 'var(--text-primary, #fff)',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      padding: '40px 20px',
      textAlign: 'center',
      gap: '0',
    }}>
      {/* Glowing number */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <p style={{
          fontSize: 'clamp(100px, 20vw, 180px)',
          fontWeight: 900,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          userSelect: 'none',
          filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.35))',
        }}>
          404
        </p>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }} />
      </div>

      <Frown size={36} style={{ opacity: 0.4, marginBottom: '20px' }} />

      <h1 style={{
        fontSize: 'clamp(22px, 4vw, 32px)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        marginBottom: '12px',
        color: 'var(--text-primary, #fff)',
      }}>
        Page not found
      </h1>
      <p style={{
        fontSize: '15px',
        color: 'var(--text-muted, #71717a)',
        maxWidth: '400px',
        lineHeight: 1.6,
        marginBottom: '36px',
      }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 22px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '14px',
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}>
          <Home size={16} />
          Go to Dashboard
        </Link>
        <Link href="javascript:history.back()" onClick={(e) => { e.preventDefault(); history.back(); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 22px',
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--text-secondary, #a1a1aa)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '14px',
          textDecoration: 'none',
          transition: 'background 150ms ease',
        }}>
          <ArrowLeft size={16} />
          Go back
        </Link>
      </div>
    </div>
  );
}
