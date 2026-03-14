"use client";

import React, { useState } from 'react';
import { useFriends } from '@/hooks/social/useFriends';
import { Button } from '@/components/ui-components';
import { Skeleton } from '@/components/quiz-components';
import { useAuthStore } from '@/store/authStore';
import { Search, UserPlus, Check, X, MessageSquare, Sword, Clock, Users, Trophy, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function FriendsPage() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { friends, requests, suggestions, isLoading, sendRequest, acceptRequest, declineRequest, removeFriend, fetchFriends } = useFriends();
  const [friendToRemove, setFriendToRemove] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const { user: currentUser } = useAuthStore();
  const router = useRouter();

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  // Live backend user search
  const handleSearchChange = async (val: string) => {
    setSearch(val);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const resp = await import('@/lib/axios').then(m => m.default.get(`/api/social/friends/search/?q=${encodeURIComponent(val)}`));
      setSearchResults(resp.data ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleAddAction = async (userId: string | number) => {
    try {
      await sendRequest(userId);
      toast.success('Friend request sent');
      // For search results, we filter them out
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to send friend request';
      toast.error(msg);
    }
  };

  const handleInvite = () => {
    toast.success('Invitation link copied to clipboard!');
    navigator.clipboard.writeText(window.location.origin + '/register');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
            Friends
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-tertiary)' }}>Connect and compete with your network.</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%', height: '38px', paddingLeft: '36px', paddingRight: '14px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', fontSize: '13.5px', color: 'var(--text-primary)',
              outline: 'none', fontFamily: 'var(--font-body)',
            }}
          />
          {/* Dropdown for search results */}
          {(searchResults.length > 0 || searching) && search.length >= 2 && (
            <div style={{
              position: 'absolute', top: '42px', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}>
              {searching ? (
                <div style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center' }}>Searching…</div>
              ) : searchResults.map(person => (
                <div key={person.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  borderBottom: '1px solid var(--border)', cursor: 'default',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0,
                  }}>
                    {person.avatar_initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.username}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{person.total_quizzes} quizzes</p>
                  </div>
                  <button onClick={() => handleAddAction(person.id)} title="Send friend request" style={{
                    padding: '4px 10px', borderRadius: '6px', background: 'var(--accent)',
                    border: 'none', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <UserPlus size={11} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <section>
          <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Clock size={12} /> Pending Requests ({requests.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {requests.map(req => (
              <div key={req.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '11px', color: 'var(--text-primary)', flexShrink: 0,
                }}>
                  {req.from_user_detail.avatar_initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.from_user_detail.username}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.from_user_detail.avg_score}% Avg Score</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptRequest(req.id)} style={{
                    width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                    background: 'var(--success)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  }}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => declineRequest(req.id)} style={{
                    width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)',
                  }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Friends list */}
        <section style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {filteredFriends.length > 0 ? `${filteredFriends.length} Friend${filteredFriends.length !== 1 ? 's' : ''}` : 'Friends'}
            </h3>
            <Button variant="outline" size="sm" onClick={() => fetchFriends()} style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}>
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filteredFriends.length > 0 ? (
            <div>
              {filteredFriends.map((friend, idx) => (
                <div key={friend.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: idx < filteredFriends.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 120ms',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)',
                      }}>
                        {friend.avatar_initials}
                      </div>
                      {friend.is_online && (
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '11px', height: '11px', background: 'var(--success)', border: '2px solid var(--bg-surface)', borderRadius: '50%' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{friend.username}</p>
                        {friend.is_online && <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Online</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trophy size={11} color="var(--warn)" /> {friend.avg_score}%
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {friend.total_quizzes} quizzes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="outline" size="sm" 
                      title="Chat" 
                      onClick={() => toast.success('Chat feature coming soon!')}
                      style={{ width: '32px', padding: 0, justifyContent: 'center' }}
                    >
                      <MessageSquare size={13} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setFriendToRemove(friend)} title="Remove friend" style={{ width: '32px', padding: 0, justifyContent: 'center', color: 'var(--danger)' }}>
                      <Trash2 size={13} />
                    </Button>
                    <Button 
                      variant="danger" size="sm" 
                      style={{ gap: '6px' }}
                      onClick={() => router.push(`/dashboard/challenges?friendId=${friend.id}`)}
                    >
                      <Sword size={12} /> Challenge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '72px 20px', textAlign: 'center' }}>
              <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No friends yet</p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Start by searching users or checking suggestions.</p>
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* People You May Know */}
          <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>People You May Know</h3>
            </div>
            {suggestions.length > 0 ? (
              <div>
                {suggestions.map((person, idx) => (
                  <div key={person.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 18px',
                    borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 120ms',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0,
                    }}>
                      {person.avatar_initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.username}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{person.avg_score}% Avg Score</p>
                    </div>
                    <button onClick={() => handleAddAction(person.id)} title="Send friend request" style={{
                      width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
                    }}>
                      <UserPlus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No suggestions available right now.</p>
              </div>
            )}
          </section>

          {/* Invite card */}
          <section style={{
            background: 'var(--accent)', color: '#fff',
            borderRadius: 'var(--radius-lg)', padding: '20px',
            boxShadow: '0 8px 24px var(--accent-subtle)',
            position: 'relative', overflow: 'hidden',
          }}>
            <Users size={80} style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Invite your team</h4>
            <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.5, marginBottom: '16px' }}>
              Sharing quizzes with friends increases learning retention by 40%.
            </p>
            <Button 
              variant="secondary" size="sm" 
              onClick={handleInvite}
              style={{ background: 'rgba(255,255,255,0.2)', borderWidth: 0, color: '#fff', width: '100%' }}
            >
              Invite Coworkers
            </Button>
          </section>
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!friendToRemove}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friendToRemove?.username} from your friends list?`}
        confirmLabel={isRemoving ? 'Removing...' : 'Remove'}
        onConfirm={async () => {
          if (!friendToRemove) return;
          setIsRemoving(true);
          try {
            await removeFriend(friendToRemove.id);
            toast.success('Friend removed');
            setFriendToRemove(null);
          } catch (e) {
            toast.error('Failed to remove friend');
          } finally {
            setIsRemoving(false);
          }
        }}
        onCancel={() => setFriendToRemove(null)}
      />
    </div>
  );
}
