"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link as LinkIcon, Send, Swords, Download, Twitter, Check } from 'lucide-react';
import { Button } from './ui-components';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';

interface ShareMenuProps {
  quizTopic: string;
  score: number;
  attemptId: string;
  shareToken?: string;
  onOpenFriends: () => void;
  onOpenChallenge: () => void;
  resultCardRef: React.RefObject<HTMLDivElement>;
}

export default function ShareMenu({ 
  quizTopic, score, attemptId, shareToken,
  onOpenFriends, onOpenChallenge, resultCardRef 
}: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${shareToken || attemptId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setIsCopied(false), 2000);
    setIsOpen(false);
  };

  const handleDownloadImage = async () => {
    if (!resultCardRef.current) return;
    setIsOpen(false);
    const loading = toast.loading('Generating image...');
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `quiz-result-${quizTopic.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Downloaded!', { id: loading });
    } catch (e) {
      toast.error('Failed to generate image', { id: loading });
    }
  };

  const handleShareToX = () => {
    const text = `I scored ${score}% on ${quizTopic} — can you beat me?`;
    const url = `${window.location.origin}/share/${shareToken || attemptId}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <Button 
        className="gap-2 bg-blue-600 hover:bg-blue-700 h-10" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="w-4 h-4" />
        Share Result
      </Button>

      {isOpen && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 12px)', right: 0,
          width: '220px', background: 'var(--bg-surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)', padding: '6px', zIndex: 100,
          animation: 'slide-up 0.2s ease-out',
        }}>
          <ShareOption icon={isCopied ? <Check size={14} /> : <LinkIcon size={14} />} label={isCopied ? "Copied!" : "Copy link"} onClick={handleCopyLink} />
          <ShareOption icon={<Send size={14} />} label="Share with friends" onClick={() => { setIsOpen(false); onOpenFriends(); }} />
          <ShareOption icon={<Swords size={14} />} label="Challenge friends" onClick={() => { setIsOpen(false); onOpenChallenge(); }} />
          <ShareOption icon={<Download size={14} />} label="Download as image" onClick={handleDownloadImage} />
          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
          <ShareOption icon={<Twitter size={14} />} label="Share to X" onClick={handleShareToX} />
        </div>
      )}
    </div>
  );
}

function ShareOption({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 12px', height: '36px',
        borderRadius: 'var(--radius-md)', border: 'none', background: 'none',
        color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 120ms ease',
        fontSize: '13px', textAlign: 'left',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <span style={{ flexShrink: 0, opacity: 0.7 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}
