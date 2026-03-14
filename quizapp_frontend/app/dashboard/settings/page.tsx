"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from '@/components/ui-components';
import { useAuth, useUpdateProfile } from '@/hooks/api-hooks';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

import {
  User, Shield, Bell, Moon, Sun, LogOut, Loader2, Save, Key, Camera,
  Check, X, Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/* ─── Section wrapper ─── */
function Section({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '14px',
      }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <h2 style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>
          {title}
        </h2>
      </div>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </section>
  );
}

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: '42px', height: '24px',
        borderRadius: '99px',
        background: checked ? 'var(--accent)' : 'var(--bg-active)',
        border: '1px solid',
        borderColor: checked ? 'var(--accent)' : 'var(--border-mid)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 200ms ease, border-color 200ms ease',
        flexShrink: 0,
      }}
      aria-checked={checked}
      role="switch"
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: checked ? 'calc(100% - 22px)' : '2px',
        width: '18px', height: '18px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 200ms ease',
      }} />
    </button>
  );
}

/* ─── Pref row ─── */
function PrefRow({ icon, label, desc, checked, onChange }: {
  icon: React.ReactNode; label: string; desc: string;
  checked: boolean; onChange: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', gap: '16px', cursor: 'pointer',
      transition: 'background 120ms ease',
      borderTop: '1px solid var(--border)',
    }}
    onClick={onChange}
    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: 'var(--accent)',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const { data: user } = useAuth();
  const { updateProfile, uploadAvatar, removeAvatar, isLoading: isUpdating } = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    email_notifications: true,
    dark_mode: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        email_notifications: user.email_notifications ?? true,
        dark_mode: user.dark_mode ?? (theme === 'dark'),
      });
      if (user.avatar_url) setAvatarPreview(user.avatar_url);
    }
  }, [user]);

  /* ── Avatar file pick ── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ── Avatar upload ── */
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(avatarFile);
      setAvatarFile(null);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /* ── Avatar remove ── */
  const handleAvatarRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setIsUploadingAvatar(true);
    try {
      await removeAvatar();
      setAvatarPreview(null);
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /* ── Profile save ── */
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingField('profile');
    try {
      await updateProfile({ username: formData.username, bio: formData.bio });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.username?.[0] || 'Failed to update profile');
    } finally {
      setSavingField(null);
    }
  };

  /* ── Password update ── */
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingField('password');
    try {
      await updateProfile({
        password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      toast.success('Password updated!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Wrong current password');
    } finally {
      setSavingField(null);
    }
  };

  /* ── Toggle preference ── */
  const togglePreference = async (key: 'email_notifications' | 'dark_mode') => {
    const newVal = !formData[key];
    setFormData(prev => ({ ...prev, [key]: newVal }));

    // If toggling dark mode: ALSO update the actual UI theme immediately
    if (key === 'dark_mode') {
      setTheme(newVal ? 'dark' : 'light');
    }

    try {
      await updateProfile({ [key]: newVal });
    } catch {
      setFormData(prev => ({ ...prev, [key]: !newVal })); // revert
      if (key === 'dark_mode') setTheme(newVal ? 'light' : 'dark'); // revert theme
      toast.error('Failed to update preference');
    }
  };

  /* ── Logout ── */
  const handleLogout = () => {
    useAuthStore.getState().logout();
  };


  const initials = (user?.username || user?.email || 'QA').substring(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--text-tertiary)' }}>
          Manage your account, security, and global preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── PROFILE ── */}
        <Section icon={<User size={14} />} title="Profile Information">
          <form onSubmit={handleProfileUpdate}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                {/* Avatar circle */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: avatarPreview ? 'transparent' : 'var(--accent-subtle)',
                    border: '2px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    fontSize: '22px', fontWeight: 800, color: 'var(--accent)',
                  }}>
                    {avatarPreview
                      ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials
                    }
                  </div>
                  {/* Upload icon overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: 'absolute', bottom: '-2px', right: '-2px',
                      width: '26px', height: '26px',
                      background: 'var(--accent)', color: '#fff',
                      border: '2px solid var(--bg-base)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 120ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
                  >
                    <Camera size={12} />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />

                <div>
                  {avatarFile ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={isUploadingAvatar}
                        onClick={handleAvatarUpload}
                        style={{ gap: '6px' }}
                      >
                        <Check size={12} /> Save Photo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setAvatarFile(null); setAvatarPreview(user?.avatar_url || null); }}
                        style={{ gap: '6px' }}
                      >
                        <X size={12} /> Cancel
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ gap: '6px' }}
                      >
                        <Camera size={12} /> Change Photo
                      </Button>
                      {user?.avatar_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAvatarRemove}
                          isLoading={isUploadingAvatar}
                          style={{ gap: '6px', color: 'var(--danger)' }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    JPG, PNG, GIF or WebP · Max 2MB
                  </p>
                </div>
              </div>

              {/* Username / Email row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Your username"
                />
                <Input
                  label="Email address"
                  value={formData.email}
                  disabled
                  hint="Email cannot be changed"
                />
              </div>

              {/* Bio */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself…"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 13px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-body)', fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    outline: 'none', resize: 'vertical',
                    transition: 'border-color 120ms ease',
                  }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
                />
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={savingField === 'profile'}
                  style={{ gap: '7px' }}
                >
                  <Save size={13} />
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </Section>

        {/* ── SECURITY ── */}
        <Section icon={<Shield size={14} />} title="Security">
          {/* Password row */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                background: 'var(--warn-subtle)', border: '1px solid var(--warn-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Key size={15} color="var(--warn)" />
              </div>
              <div>
                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Password</p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Keep your account secure with a strong password</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? 'Cancel' : 'Update'}
            </Button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordUpdate}>
              <div style={{
                padding: '20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                display: 'flex', flexDirection: 'column', gap: '14px',
              }}>
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    hint="At least 8 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    error={
                      passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                        ? 'Passwords do not match' : undefined
                    }
                  />
                </div>
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={savingField === 'password'}
                    style={{ gap: '6px' }}
                  >
                    <Lock size={12} /> Update Password
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* 2FA row */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            opacity: 0.45,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                background: 'var(--info-subtle)', border: '1px solid var(--info-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Shield size={15} color="var(--info)" />
              </div>
              <div>
                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Two-Factor Authentication</p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Coming soon — extra layer of security</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>Enable</Button>
          </div>
        </Section>

        {/* ── PREFERENCES ── */}
        <Section icon={<Bell size={14} />} title="Preferences">
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                background: 'var(--success-subtle)', border: '1px solid var(--success-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Bell size={15} color="var(--success)" />
              </div>
              <div>
                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Email Notifications</p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Get updates on challenges and results</p>
              </div>
            </div>
            <Toggle checked={formData.email_notifications} onChange={() => togglePreference('email_notifications')} />
          </div>

          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            cursor: 'pointer', transition: 'background 120ms ease',
          }}
          onClick={() => togglePreference('dark_mode')}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {formData.dark_mode ? <Moon size={15} color="var(--accent)" /> : <Sun size={15} color="var(--accent)" />}
              </div>
              <div>
                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formData.dark_mode ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formData.dark_mode ? 'Currently using dark theme' : 'Currently using light theme'}
                </p>
              </div>
            </div>
            <Toggle checked={formData.dark_mode} onChange={() => togglePreference('dark_mode')} />
          </div>
        </Section>

        {/* ── DANGER ZONE ── */}
        <Section icon={<LogOut size={14} />} title="Account">
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Signing out will clear your session on this device.
            </p>
            <SignOutButton />
          </div>
        </Section>

      </div>
    </div>
  );
}

/* ── Separate component so it can use useAuth cleanly ── */
function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleSignOut}
      style={{ gap: '7px' }}
    >
      <LogOut size={13} />
      Sign Out
    </Button>
  );
}
