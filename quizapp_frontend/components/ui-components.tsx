"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ─── SPINNER ─── */
export const Spinner = ({
  size = 'md',
  inverted = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}) => {
  const dim = { sm: '14px', md: '20px', lg: '26px' }[size];
  const bw  = { sm: '1.5px', md: '2px', lg: '2.5px' }[size];
  return (
    <div style={{
      width: dim, height: dim, borderRadius: '50%', borderStyle: 'solid',
      borderWidth: bw,
      borderColor: inverted ? 'rgba(255,255,255,0.15)' : 'var(--border-mid)',
      borderTopColor: inverted ? '#fff' : 'var(--accent)',
      borderRightColor: inverted ? 'rgba(255,255,255,0.15)' : 'var(--border-mid)',
      borderBottomColor: inverted ? 'rgba(255,255,255,0.15)' : 'var(--border-mid)',
      borderLeftColor: inverted ? 'rgba(255,255,255,0.15)' : 'var(--border-mid)',
      animation: 'qs-spin 0.65s linear infinite',
      display: 'inline-block', flexShrink: 0,
    }} />
  );
};

/* ─── BUTTON ─── */
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  isLoading?: boolean;
}

const BtnVariantStyles: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background: 'var(--accent)', color: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent' },
  secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-mid)' },
  outline:   { background: 'transparent', color: 'var(--text-primary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-mid)' },
  ghost:     { background: 'transparent', color: 'var(--text-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'transparent' },
  danger:    { background: 'var(--danger-subtle)', color: 'var(--danger)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--danger-border)' },
  success:   { background: 'var(--success-subtle)', color: 'var(--success)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--success-border)' },
};

const BtnHoverStyles: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background: 'var(--accent-hover)' },
  secondary: { background: 'var(--bg-active)', borderColor: 'var(--border-hi)' },
  outline:   { background: 'var(--bg-hover)', borderColor: 'var(--border-hi)' },
  ghost:     { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
  danger:    { background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' },
  success:   { background: 'var(--success)', color: '#fff', borderColor: 'var(--success)' },
};

const BtnSizeStyles: Record<BtnSize, React.CSSProperties> = {
  xs: { height: '26px', padding: '0 10px', fontSize: '11px' },
  sm: { height: '32px', padding: '0 14px', fontSize: '12.5px' },
  md: { height: '38px', padding: '0 18px', fontSize: '13.5px' },
  lg: { height: '44px', padding: '0 22px', fontSize: '14.5px' },
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  className,
  children,
  style,
  ...props
}: ButtonProps) => {
  const [hovered, setHovered] = React.useState(false);
  const isDisabled = disabled || isLoading;

  const baseStyle = BtnSizeStyles[size];
  const varStyle  = BtnVariantStyles[variant];
  const hovStyle  = hovered && !isDisabled ? BtnHoverStyles[variant] : {};

  return (
    <button
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...baseStyle,
        ...varStyle,
        ...hovStyle,
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        borderRadius: 'var(--radius-md)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease, opacity 120ms ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {isLoading && <Loader2 style={{ width: '13px', height: '13px', animation: 'qs-spin 0.65s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  );
};

/* ─── INPUT ─── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, style, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 500,
            color: focused ? 'var(--text-primary)' : 'var(--text-secondary)',
            letterSpacing: '0.01em',
            transition: 'color 120ms ease',
          }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={className}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 13px',
            background: 'var(--bg-elevated)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '13.5px',
            color: 'var(--text-primary)',
            outline: 'none',
            boxShadow: focused
              ? error
                ? '0 0 0 3px var(--danger-subtle)'
                : '0 0 0 3px var(--accent-subtle)'
              : 'none',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
            ...style,
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '11.5px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚠ {error}
          </span>
        )}
        {!error && hint && (
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{hint}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* ─── CARD ─── */
export const Card = ({
  header,
  footer,
  children,
  className,
  style,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={className}
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      ...style,
    }}
  >
    {header && (
      <div style={{
        padding: '13px 18px',
        borderBottom: '1px solid var(--border)',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}>
        {header}
      </div>
    )}
    <div style={{ padding: '18px' }}>{children}</div>
    {footer && (
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        background: 'var(--bg-elevated)',
      }}>
        {footer}
      </div>
    )}
  </div>
);

/* ─── STAT CARD ─── */
export const StatCard = ({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
}) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
    </div>
    <div style={{ fontSize: '28px', fontWeight: 800, color: accent || 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
      {value}
    </div>
    {sub && <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{sub}</p>}
  </div>
);

/* ─── DIFFICULTY BADGE ─── */
export const DifficultyBadge = ({ level }: { level: 'easy' | 'medium' | 'hard' }) => {
  const map = {
    easy:   'chip chip-success',
    medium: 'chip chip-warn',
    hard:   'chip chip-danger',
  } as const;
  return (
    <span className={map[level]}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

/* ─── SKELETON ─── */
export const Skeleton = ({ width = '100%', height = '16px', className }: {
  width?: string; height?: string; className?: string;
}) => (
  <div
    className={className}
    style={{
      width, height,
      background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-active) 50%, var(--bg-elevated) 75%)',
      backgroundSize: '400% 100%',
      borderRadius: 'var(--radius-sm)',
      animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
    }}
  />
);

/* ─── DIVIDER ─── */
export const Divider = ({ label }: { label?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    {label && <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>}
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
  </div>
);

/* ─── SECTION HEADER ─── */
export const SectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</h2>
    {action}
  </div>
);
