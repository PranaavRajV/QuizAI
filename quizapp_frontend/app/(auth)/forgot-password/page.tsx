"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/api/users/auth/password-reset/', data);
      setDone(true);
      toast.success('Reset link sent!');
    } catch (e) {
      toast.error('Something went wrong. Please try again.');
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

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ 
          width: '56px', height: '56px', borderRadius: '50%', background: 'var(--success-subtle)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={s.title}>Check your email</h2>
        <p style={s.sub}>If an account exists, we've sent instructions to reset your password.</p>
        <Link href="/login">
          <button className="btn-primary" style={{ width: '100%', height: '42px' }}>Back to login</button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 style={s.title}>Reset password</h2>
      <p style={s.sub}>Enter your email address and we'll send you a link to reset your password.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '24px' }}>
          <label style={s.label}>Email address</label>
          <input
            className={`form-input${errors.email ? ' err' : ''}`}
            type="email"
            placeholder="alex@example.com"
            {...register('email')}
          />
          {errors.email?.message && (
            <div style={s.errText}>{errors.email.message as string}</div>
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
          {loading ? <span className="qs-spinner sm inv" /> : 'Send reset link'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
        <Link href="/login" style={{ color: 'var(--ink2)', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
