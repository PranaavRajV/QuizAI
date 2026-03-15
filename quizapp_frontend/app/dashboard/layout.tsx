"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SearchDropdown, NotificationDropdown } from '@/components/NavbarDropdowns';
import { useNotifications, usePushNotifications } from '@/hooks/api-hooks';
import { Button } from '@/components/ui-components';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboard, BookOpen, History, BarChart2, Trophy,
  Users, Swords, Settings, ChevronRight, Menu, LogOut,
  Sparkles
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard',   href: '/dashboard',              icon: LayoutDashboard },
  { label: 'My Quizzes',  href: '/dashboard/quizzes',      icon: BookOpen },
  { label: 'History',     href: '/dashboard/history',      icon: History },
  { label: 'Analytics',   href: '/dashboard/analytics',    icon: BarChart2 },
  { label: 'Leaderboard', href: '/dashboard/leaderboard',  icon: Trophy },
  { label: 'Friends',     href: '/dashboard/friends',      icon: Users,   badge: 'friends' as const },
  { label: 'Challenges',  href: '/dashboard/challenges',   icon: Swords,  badge: 'challenges' as const },
];

function AvatarMenu({ user, logout, initials }: {
  user: any; logout: () => void; initials: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="User menu"
        aria-expanded={open}
        style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'var(--accent-subtle)',
          borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: 'var(--accent-hover)',
          cursor: 'pointer', overflow: 'hidden', padding: 0,
          transition: 'border-color 120ms ease',
        }}
      >
        {user?.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute', top: '38px', right: 0, zIndex: 100,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '8px',
            minWidth: '190px', boxShadow: 'var(--shadow-xl)',
            animation: 'slide-up 0.15s ease',
            fontFamily: 'var(--font-body)',
          }}>
            <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.username || user?.email?.split('@')[0]}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</p>
            </div>
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              ⚙️ Settings
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                fontSize: '13px', fontWeight: 500, color: 'var(--danger)',
                background: 'none', borderWidth: 0, cursor: 'pointer',
                width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)',
              }}
            >
              🚪 Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({
  href, icon: Icon, label, badgeCount, active,
}: {
  href: string; icon: React.ElementType; label: string;
  badgeCount?: number; active: boolean;
}) {
  return (
    <Link href={href}>
      <div 
        className={active ? 'glass-panel' : 'hover-lift'}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          fontSize: '13px', fontWeight: active ? 600 : 500,
          color: active ? 'var(--accent)' : 'var(--text-tertiary)',
          background: active ? 'var(--accent-subtle)' : 'transparent',
          border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
          transition: 'all 120ms ease',
          marginBottom: '2px',
          position: 'relative',
        }}
      >
        <Icon
          size={16}
          style={{
            flexShrink: 0,
            color: active ? 'var(--accent)' : 'currentColor',
            opacity: active ? 1 : 0.6,
          }}
        />
        <span style={{ flex: 1 }}>{label}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span style={{
            background: 'var(--accent)', color: '#fff',
            fontSize: '10px', fontWeight: 800,
            padding: '1px 6px', borderRadius: 'var(--radius-pill)',
            lineHeight: '16px', minWidth: '18px', textAlign: 'center',
            boxShadow: '0 2px 4px var(--accent-subtle)'
          }}>
            {badgeCount}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { data: notifications } = useNotifications();
  const { isSupported, permission, requestPermission, sendNotification } = usePushNotifications();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);
  const [prevNotifCount, setPrevNotifCount] = useState(0);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Handle soft prompt for first-time users
  useEffect(() => {
    if (isSupported && permission === 'default') {
      const hasSeen = localStorage.getItem('notif_prompt_seen');
      if (!hasSeen) {
        setShowSoftPrompt(true);
      }
    }
  }, [isSupported, permission]);

  // Trigger browser notifications on new unread notifications
  useEffect(() => {
    const unread = user?.notifications_unread || 0;
    if (unread > prevNotifCount && Array.isArray(notifications) && notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.is_read) {
        sendNotification('New Notification', {
          body: latest.message,
          icon: '/favicon.ico'
        });
      }
    }
    setPrevNotifCount(unread);
  }, [user?.notifications_unread, notifications, sendNotification, prevNotifCount]);

  const handleAllowNotifications = async () => {
    const res = await requestPermission();
    setShowSoftPrompt(false);
    localStorage.setItem('notif_prompt_seen', 'true');
    if (res === 'granted') toast.success('Notifications enabled!');
  };

  const pageTitle = (() => {
    const seg = pathname.split('/').filter(Boolean);
    const last = seg[seg.length - 1] || 'dashboard';
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  })();

  const initials = (user?.username || user?.email || 'QA').substring(0, 2).toUpperCase();
  const displayName = user?.username || user?.email?.split('@')[0] || 'Student';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const friendCount    = user?.pending_friend_requests_count || 0;
  const challengeCount = user?.pending_challenges_count || 0;

  const getBadge = (key?: 'friends' | 'challenges') => {
    if (key === 'friends') return friendCount;
    if (key === 'challenges') return challengeCount;
    return undefined;
  };

  const SidebarContent = (
    <div style={{
      width: '220px', flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100%', position: 'relative',
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'var(--accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px var(--accent-subtle)',
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14.5px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}>
              PurpleQuiz AI
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {/* Main nav */}
        <p style={{
          fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '8px 11px 4px',
        }}>
          Main
        </p>
        {menuItems.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            badgeCount={getBadge(item.badge)}
            active={pathname === item.href}
          />
        ))}

        {/* Account section */}
        <p style={{
          fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '16px 11px 4px',
        }}>
          Account
        </p>
        <NavItem
          href="/dashboard/settings"
          icon={Settings}
          label="Profile & Settings"
          active={pathname === '/dashboard/settings'}
        />

      </div>

      {/* User footer */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 11px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          border: '1px solid transparent',
          transition: 'all 120ms ease',
        }}
        onClick={() => router.push('/dashboard/settings')}
        onMouseEnter={e => {

          const el = e.currentTarget as HTMLDivElement;
          el.style.background = 'var(--bg-elevated)';
          el.style.borderColor = 'var(--border)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.background = 'transparent';
          el.style.borderColor = 'transparent';
        }}>
          {/* Avatar */}
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: 'var(--accent-hover)',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          {/* Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {displayName}
            </div>
            <div style={{
              fontSize: '10.5px', color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email || ''}
            </div>
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center',
              transition: 'color 120ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Desktop sidebar */}
      <div className="md-sidebar">
        {SidebarContent}
      </div>

      {/* Mobile drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.22s cubic-bezier(.28,.11,.29,1)',
        width: '220px',
        boxShadow: mobileOpen ? 'var(--shadow-xl)' : 'none',
      }}>
        {SidebarContent}
      </div>

      <style>{`
        .md-sidebar { display: none; }
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .topbar-menu-btn { display: none !important; }
        }
      `}</style>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{
          height: '52px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px',
          gap: '12px',
          flexShrink: 0,
        }}>
          {/* Menu button (mobile) */}
          <button
            className="topbar-menu-btn"
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: '4px',
              display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)',
            }}
          >
            <Menu size={18} />
          </button>

          {/* Page title */}
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {pageTitle}
          </span>

          {/* Spacer */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationDropdown />
            <SearchDropdown />

            <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 2px' }} />

            <AvatarMenu user={user} logout={logout} initials={initials} />
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>
        {/* Notification Soft Prompt */}
        {showSoftPrompt && (
          <div 
            className="glass-panel"
            style={{
              position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
              width: '320px', 
              borderRadius: 'var(--radius-xl)',
              padding: '24px', 
              boxShadow: 'var(--shadow-xl)',
              animation: 'pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid var(--accent-border)'
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Enable Live Alerts?
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  Get notified for challenges and friend requests while you're away.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button size="sm" variant="primary" onClick={handleAllowNotifications} style={{ flex: 1 }}>
                Allow
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowSoftPrompt(false); localStorage.setItem('notif_prompt_seen', 'true'); }} style={{ flex: 1, color: 'var(--text-muted)' }}>
                Maybe Later
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
