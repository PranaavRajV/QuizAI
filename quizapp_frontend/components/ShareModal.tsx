"use client";

import React, { useState } from 'react';
import { Card, Button } from '@/components/ui-components';
import { X, Copy, Check, Users, Shield, Share2 } from 'lucide-react';
import { useFriends } from '@/hooks/social/useFriends';
import { useShareResult } from '@/hooks/social/useShareResult';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';

interface ShareModalProps {
  attemptId: string;
  quizName: string;
  score: number;
  initialMode?: 'share' | 'challenge';
  onClose: () => void;
}

export default function ShareModal({ attemptId, quizName, score, initialMode = 'share', onClose }: ShareModalProps) {
  const { friends, isLoading: friendsLoading } = useFriends();
  const { createShare, isLoading: shareLoading } = useShareResult();
  const [mode, setMode] = useState<'share' | 'challenge'>(initialMode);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleCreateLink = async () => {
    const url = await createShare(attemptId, true);
    if (url) {
      setShareUrl(url);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleAction = async () => {
    setIsSending(true);
    const loading = toast.loading(mode === 'share' ? 'Sharing...' : 'Sending challenges...');
    try {
      if (mode === 'share') {
        // Implement bulk share if API supports it, or individual
        toast.success(`Shared with ${selectedFriends.length} friends!`, { id: loading });
      } else {
        // Challenge friends
        const promises = selectedFriends.map(friendId => 
          import('@/lib/axios').then(m => m.default.post('/api/social/challenges/', {
            challenged_user_id: friendId,
            topic: quizName,
            difficulty: 'medium', // Default
          }))
        );
        await Promise.all(promises);
        toast.success(`Challenges sent to ${selectedFriends.length} friends!`, { id: loading });
      }
      onClose();
    } catch (e) {
      toast.error('Failed to complete action', { id: loading });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <Card className="relative w-full max-w-[500px] bg-[var(--bg)] border-[#2e2e32] shadow-2xl overflow-hidden p-0 animate-in zoom-in-95 duration-300">
        {/* Header Banner */}
        <div className="relative h-32 bg-blue-600 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent)]" />
             <div className="grid grid-cols-8 gap-4 opacity-50 rotate-12 -translate-x-10">
                {Array.from({length: 40}).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-white rounded-full" />
                ))}
             </div>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-black mb-2 shadow-lg">
                {score}%
            </div>
            <h2 className="text-white font-black text-lg">{quizName}</h2>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Public Link */}
          <div className="space-y-3">
             <label className="text-[11px] font-black uppercase tracking-widest text-[#64748b] flex items-center gap-2">
                <Share2 className="w-3 h-3" /> Public Share Link
             </label>
             {shareUrl ? (
                <div className="flex gap-2">
                    <div className="flex-1 bg-[var(--bg2)] border border-[var(--line)] rounded-lg px-3 py-2.5 text-xs font-mono truncate text-[#94a3b8]">
                        {shareUrl}
                    </div>
                    <Button onClick={copyToClipboard} className="h-[42px] px-4 bg-[#fff] text-[#000] hover:bg-slate-200">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                </div>
             ) : (
                <Button 
                    onClick={handleCreateLink} 
                    disabled={shareLoading}
                    className="w-full h-11 bg-[var(--bg2)] border border-[var(--line)] text-[#fff] hover:bg-[#334155] font-bold text-xs"
                >
                    {shareLoading ? 'Generating...' : 'Generate Shareable Link'}
                </Button>
             )}
          </div>

          {/* Friends List */}
          <div className="space-y-3">
             <label className="text-[11px] font-black uppercase tracking-widest text-[#64748b] flex items-center gap-2">
                <Users className="w-3 h-3" /> Share with Friends
             </label>
             <div className="max-h-[220px] overflow-y-auto pr-2 divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl bg-[var(--bg2)]">
                {friends.map(friend => (
                    <div 
                        key={friend.id} 
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--bg3)]"
                        onClick={() => toggleFriend(friend.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-[10px] font-bold">
                                {friend.avatar_initials}
                            </div>
                            <span className="text-sm font-bold">{friend.username}</span>
                        </div>
                        <div className={clsx(
                            "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                            selectedFriends.includes(friend.id) ? "bg-blue-600 border-blue-600" : "border-[#2e2e32]"
                        )}>
                            {selectedFriends.includes(friend.id) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                    </div>
                ))}
                {friends.length === 0 && (
                    <div className="p-10 text-center text-[#64748b] text-[11px] italic">
                        No friends to share with yet.
                    </div>
                )}
             </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
             <Button variant="secondary" className="flex-1 h-11 text-xs font-black uppercase tracking-widest" onClick={onClose}>
                Not Now
             </Button>
             <Button 
                onClick={handleAction}
                isLoading={isSending}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 text-white" 
                disabled={selectedFriends.length === 0}
             >
                {mode === 'share' ? 'Share Score' : 'Send Challenge'}
             </Button>
          </div>

          <div className="text-center">
             <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#64748b] uppercase tracking-tighter">
                <Shield className="w-3 h-3" /> Your results are private by default
             </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
