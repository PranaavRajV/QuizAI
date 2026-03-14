"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

/* ── Small inline components matching reference HTML exactly ── */

function BrandHeadline() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '32px' }}>
      <div className="serif-italic" style={{
        fontSize: '34px', color: '#ffffff', lineHeight: '1.15', letterSpacing: '-0.5px', marginBottom: '12px',
      }}>
        Generate. Learn.<br />Master anything.
      </div>
      <span style={{
        fontFamily: 'var(--body)', fontSize: '13px', color: '#94a3b8', fontWeight: 400, letterSpacing: 0,
        maxWidth: '280px', lineHeight: '1.6',
      }}>
        AI-powered quizzes tailored to your knowledge level and goals.
      </span>
    </div>
  );
}

function ShowHideBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: 'var(--ink3)', fontSize: '12px', fontFamily: 'var(--body)', fontWeight: 500,
      }}
    >
      {show ? 'Hide' : 'Show'}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, googleLogin } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await googleLogin(tokenResponse.access_token);
        router.push('/dashboard');
      } catch (err) {
        toast.error('Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google login failed'),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      router.push(searchParams.get('redirect') || '/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── left panel headline & dots injected into layout slot ── */
  React.useEffect(() => {
    const slot = document.getElementById('auth-headline-slot');
    if (slot) {
      slot.innerHTML = `
        <div style="font-family:var(--serif);font-style:italic;font-size:34px;color:#fff;line-height:1.15;letter-spacing:-0.5px;margin-bottom:12px;">
          Generate. Learn.<br>Master anything.
        </div>
        <span style="font-family:var(--body);font-size:13px;color:#94a3b8;font-weight:400;max-width:280px;line-height:1.6;display:block;">
          AI-powered quizzes tailored to your knowledge level and goals.
        </span>`;
    }
    const dots = document.getElementById('auth-dots-slot');
    if (dots) {
      dots.innerHTML = `
        <div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:#334155"></div>`;
    }
  }, []);

  const s = {
    title: { fontFamily: 'var(--head)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px', letterSpacing: '-0.3px' } as React.CSSProperties,
    sub:   { fontSize: '13px', color: 'var(--ink2)', marginBottom: '28px' } as React.CSSProperties,
    label: { display: 'block', fontSize: '11.5px', fontWeight: 500, color: 'var(--ink2)', marginBottom: '5px', letterSpacing: '0.2px' } as React.CSSProperties,
    field: { marginBottom: '14px' } as React.CSSProperties,
    iRel:  { position: 'relative' } as React.CSSProperties,
    errText: { fontSize: '11.5px', color: 'var(--red)', marginTop: '4px' } as React.CSSProperties,
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={s.title}>Welcome back</div>
      <p style={s.sub}>Sign in to your account</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div style={s.field}>
          <label style={s.label}>Email address</label>
          <input
            autoFocus
            className={`form-input${errors.email ? ' err' : ''}`}
            type="email"
            placeholder="alex@example.com"
            {...register('email')}
          />
          {errors.email && <div style={s.errText}>{errors.email.message}</div>}
        </div>

        {/* Password */}
        <div style={s.field}>
          <label style={s.label}>Password</label>
          <div style={s.iRel}>
            <input
              className="form-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              style={{ paddingRight: '48px' }}
              {...register('password')}
            />
            <ShowHideBtn show={showPass} toggle={() => setShowPass(!showPass)} />
          </div>
          {errors.password && <div style={s.errText}>{errors.password.message}</div>}
        </div>

        {/* Remember / Forgot */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--ink2)', cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: 'var(--ink)', width: '14px', height: '14px' }} />
            Keep me signed in
          </label>
          <Link href="/forgot-password" style={{ fontSize: '12.5px', color: 'var(--blue)', fontWeight: 500, textDecoration: 'none' }}>
            Reset password
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', height: '42px',
            background: loading ? 'var(--line2)' : 'var(--accent)',
            color: loading ? 'var(--ink)' : 'var(--accent-fg)', // Better contrast for loading state
            border: 'none', borderRadius: 'var(--rm)',
            fontFamily: 'var(--body)', fontSize: '13.5px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '0 16px', // Standardized horizontal padding
            transition: 'opacity 0.15s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <><span className="qs-spinner sm inv" /> Signing in…</>
            : 'Continue'}
        </button>

        {/* Error banner */}
        {error && (
          <div style={{
            marginTop: '10px', padding: '10px 12px',
            background: 'var(--red-bg)', border: '1px solid #7f1d1d',
            borderRadius: 'var(--rm)', fontSize: '12.5px', color: 'var(--red)',
          }}>
            {error}
          </div>
        )}
      </form>

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        margin: '16px 0', color: 'var(--ink3)', fontSize: '11.5px',
      }}>
        <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        or
        <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        disabled={loading}
        style={{
          width: '100%', height: '40px',
          background: 'var(--bg)', border: '1px solid var(--line2)',
          borderRadius: 'var(--rm)', fontFamily: 'var(--body)',
          fontSize: '13px', fontWeight: 500, color: 'var(--ink)', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '0 16px', // Standardized horizontal padding
          transition: 'background 0.12s',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--bg2)')}
        onMouseLeave={e => !loading && (e.currentTarget.style.background = 'var(--bg)')}
      >
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Footer link */}
      <div style={{ fontSize: '12.5px', color: 'var(--ink2)', textAlign: 'center', marginTop: '18px' }}>
        No account yet?{' '}
        <Link href="/register" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}>
          Create one
        </Link>
      </div>
    </div>
  );
}
