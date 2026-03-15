"use client";

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string()
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    if (!uid || !token) {
      toast.error('Invalid or missing reset token. Ensure you clicked the full link.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/auth/password-reset-confirm/', {
        uid,
        token,
        password: data.password
      });
      toast.success('Password reset successful! You can now log in.');
      router.push('/login');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    title: { fontFamily: 'var(--head)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px', letterSpacing: '-0.3px' } as React.CSSProperties,
    sub:   { fontSize: '13.5px', color: 'var(--ink2)', marginBottom: '28px', lineHeight: 1.5 } as React.CSSProperties,
    label: { display: 'block', fontSize: '11.5px', fontWeight: 500, color: 'var(--ink2)', marginBottom: '5px' } as React.CSSProperties,
    errText: { fontSize: '11.5px', color: 'var(--red)', marginTop: '4px' } as React.CSSProperties,
  };

  return (
    <div>
      <h2 style={s.title}>Set new password</h2>
      <p style={s.sub}>Please enter your new password below.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '16px' }}>
          <label style={s.label}>New password</label>
          <input
            className={`form-input${errors.password ? ' err' : ''}`}
            type="password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password?.message && (
            <div style={s.errText}>{errors.password.message as string}</div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={s.label}>Confirm password</label>
          <input
            className={`form-input${errors.password_confirm ? ' err' : ''}`}
            type="password"
            placeholder="••••••••"
            {...register('password_confirm')}
          />
          {errors.password_confirm?.message && (
            <div style={s.errText}>{errors.password_confirm.message as string}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', height: '42px',
            background: loading ? 'var(--line2)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 'var(--rm)',
            fontSize: '13.5px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          {loading ? <span className="qs-spinner sm inv" /> : 'Reset password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="qs-spinner sm" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
