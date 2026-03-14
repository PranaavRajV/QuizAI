"use client";

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Required'),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type RegisterForm = z.infer<typeof schema>;

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

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const { googleLogin } = useAuthStore();

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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const segClass = (i: number) => {
    if (strength < i) return 'str-seg';
    if (strength <= 1) return 'str-seg w';
    if (strength === 2) return 'str-seg f';
    return 'str-seg g';
  };

  const strengthLabel = () => {
    if (!password) return 'Enter password to check strength';
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return (labels[strength] || 'Weak') + ' password';
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      await registerUser({
        username: data.email.split('@')[0],
        email: data.email,
        password: data.password,
        password_confirm: data.confirmPassword,
      });
      router.push('/login?registered=true');
    } catch (e: any) {
      setError(Object.values(e.response?.data || {}).flat().join(', ') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  /* Inject headline into layout slot */
  React.useEffect(() => {
    const slot = document.getElementById('auth-headline-slot');
    if (slot) {
      slot.innerHTML = `
        <div style="font-family:var(--serif);font-style:italic;font-size:34px;color:#fff;line-height:1.15;letter-spacing:-0.5px;margin-bottom:12px;">
          Start learning<br>differently.
        </div>
        <span style="font-family:var(--body);font-size:13px;color:#94a3b8;font-weight:400;max-width:280px;line-height:1.6;display:block;">
          Join thousands mastering new skills with AI-generated quiz content.
        </span>`;
    }
    const dots = document.getElementById('auth-dots-slot');
    if (dots) {
      dots.innerHTML = `
        <div style="width:6px;height:6px;border-radius:50%;background:#334155"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>`;
    }
  }, []);

  const label: React.CSSProperties = {
    display: 'block', fontSize: '11.5px', fontWeight: 500,
    color: 'var(--ink2)', marginBottom: '5px', letterSpacing: '0.2px',
  };
  const field: React.CSSProperties = { marginBottom: '14px' };
  const iRel: React.CSSProperties = { position: 'relative' };
  const errText: React.CSSProperties = { fontSize: '11.5px', color: 'var(--red)', marginTop: '4px' };
  const hint: React.CSSProperties = { fontSize: '11.5px', color: 'var(--ink3)', marginTop: '4px' };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontFamily: 'var(--head)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px', letterSpacing: '-0.3px' }}>
        Create account
      </div>
      <p style={{ fontSize: '13px', color: 'var(--ink2)', marginBottom: '28px' }}>
        Free to start, no credit card required
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div style={field}>
          <label style={label}>Email address</label>
          <input
            className={`form-input${errors.email ? ' err' : ''}`}
            type="email"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <div style={errText}>{errors.email.message}</div>}
        </div>

        {/* Password */}
        <div style={field}>
          <label style={label}>Password</label>
          <div style={iRel}>
            <input
              className="form-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              style={{ paddingRight: '48px' }}
              {...register('password')}
            />
            <ShowHideBtn show={showPass} toggle={() => setShowPass(!showPass)} />
          </div>
          {errors.password && <div style={errText}>{errors.password.message}</div>}
          {/* Strength bar */}
          <div style={{ display: 'flex', gap: '3px', marginTop: '7px' }}>
            {[1,2,3,4].map(i => <div key={i} className={segClass(i)} />)}
          </div>
          <p style={hint}>{strengthLabel()}</p>
        </div>

        {/* Confirm password */}
        <div style={field}>
          <label style={label}>Confirm password</label>
          <div style={iRel}>
            <input
              className={`form-input${errors.confirmPassword ? ' err' : ''}`}
              type={showConf ? 'text' : 'password'}
              placeholder="Repeat password"
              style={{ paddingRight: '48px' }}
              {...register('confirmPassword')}
            />
            <ShowHideBtn show={showConf} toggle={() => setShowConf(!showConf)} />
          </div>
          {errors.confirmPassword && <div style={errText}>{errors.confirmPassword.message}</div>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', height: '42px', marginTop: '6px',
            background: loading ? 'var(--line2)' : 'var(--accent)',
            color: loading ? 'var(--ink)' : 'var(--accent-fg)', // Better contrast for loading state
            border: 'none', borderRadius: 'var(--rm)',
            fontFamily: 'var(--body)', fontSize: '13.5px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '0 16px', // Standardized horizontal padding
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading
            ? <><span className="qs-spinner sm inv" /> Creating…</>
            : 'Create account'}
        </button>

        {/* Error */}
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
          padding: '0 16px',
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

      <div style={{ fontSize: '12.5px', color: 'var(--ink2)', textAlign: 'center', marginTop: '18px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
