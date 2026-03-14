import React from 'react';

/* Brand logo square */
const BrandSq = () => (
  <div style={{
    width: '28px', height: '28px', background: '#fff', borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
      <rect x="2" y="2" width="5" height="5" rx="1" fill="#0A0A0A"/>
      <rect x="9" y="2" width="5" height="5" rx="1" fill="#0A0A0A"/>
      <rect x="2" y="9" width="5" height="5" rx="1" fill="#0A0A0A"/>
      <circle cx="11.5" cy="11.5" r="2.5" fill="#0A0A0A"/>
    </svg>
  </div>
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg3)',
    }}>
      <div
        className="auth-wrap"
        style={{ width: '100%', maxWidth: '900px' }}
      >
        {/* Left panel — headline content injected by child page via useEffect */}
        <div className="auth-left" id="auth-left-panel">
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrandSq />
            <span style={{ fontFamily: 'var(--head)', fontSize: '15px', fontWeight: 600, color: '#fff' }}>
              QuizAI
            </span>
          </div>

          {/* Headline slot — filled by page via useEffect */}
          <div id="auth-headline-slot" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '32px' }}>
            {/* Filled by child page */}
          </div>

          {/* Dots slot — filled by page via useEffect */}
          <div id="auth-dots-slot" style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#334155' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#334155' }} />
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}>
            <React.Suspense fallback={<div className="p-12 text-center text-[#64748b]">Loading...</div>}>
              {children}
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
