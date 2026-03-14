"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// SKELETON
export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("animate-pulse bg-[#f1f5f9] rounded-[7px]", className)} />
  );
};

// PROGRESS BAR
export const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
      <div 
        className="h-full bg-[#0A0A0A] transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

// CIRCULAR SCORE
export const CircularScore = ({ score, size = 120 }: { score: number, size?: number }) => {
  const [currentSize, setCurrentSize] = React.useState(size);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCurrentSize(Math.min(size, 120));
      } else {
        setCurrentSize(size);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  const finalSize = currentSize;
  const radius = (finalSize - 10) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center transition-all duration-300" style={{ width: finalSize, height: finalSize }}>
      <svg className="transform -rotate-90" width={finalSize} height={finalSize}>
        <circle
          cx={finalSize / 2}
          cy={finalSize / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="6"
          fill="transparent"
          className="dark:stroke-zinc-800"
        />
        <circle
          cx={finalSize / 2}
          cy={finalSize / 2}
          r={radius}
          stroke="#0A0A0A"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          className="transition-all duration-1000 ease-out dark:stroke-white"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold dark:text-white">{Math.round(score)}%</span>
        <span className="text-[10px] uppercase tracking-wider text-[#64748b] font-bold">Score</span>
      </div>
    </div>
  );
};

// MODAL
export const Modal = ({ isOpen, onClose, title, children, footer }: {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: React.ReactNode,
  footer?: React.ReactNode
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px',
              borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', cursor: 'pointer',
              transition: 'color 120ms, background 120ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
