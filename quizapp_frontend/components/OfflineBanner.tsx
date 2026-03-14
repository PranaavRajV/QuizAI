"use client";

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const handleOffline = () => { setIsOffline(true); setWasOffline(true); };
    const handleOnline = () => {
      setIsOffline(false);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    // Set initial state
    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showBack) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 20px',
      borderRadius: '99px',
      background: isOffline ? 'var(--danger)' : 'var(--success)',
      color: '#fff',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: 'var(--font-body)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      animation: 'slide-down 0.3s ease-out',
      whiteSpace: 'nowrap',
    }}>
      <WifiOff size={14} />
      {isOffline ? "You're offline — some features may not work" : '✓ Back online'}
    </div>
  );
}
