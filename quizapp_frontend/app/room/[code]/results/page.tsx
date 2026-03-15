"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui-components';
import { Trophy, Home, RotateCcw, Medal, Users } from 'lucide-react';
import api from '@/lib/axios';
import { Room } from '@/types/api';

export default function MultiplayerResultsPage() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resp = await api.get(`/api/quizzes/rooms/${code}/`);
        setRoom(resp.data);
      } catch (e) {
        console.error("Failed to load results", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (code) fetchResults();
  }, [code]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '100px' }}>Loading Results...</div>;
  if (!room) return <div style={{ textAlign: 'center', padding: '100px' }}>Room not found.</div>;

  const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);
  const winner = sortedParticipants[0];

  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
          <Trophy size={80} color="var(--warn)" />
          <div style={{ position: 'absolute', top: -10, right: -10, background: 'var(--accent)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>#1</div>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '8px' }}>Final Leaderboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Challenge completed for <strong style={{ color: 'var(--text-primary)' }}>{room.quiz_topic}</strong></p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedParticipants.map((p, i) => (
          <div 
            key={p.username} 
            style={{ 
              background: i === 0 ? 'var(--accent-subtle)' : 'var(--bg-surface)', 
              border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                background: i === 0 ? 'var(--warn)' : i === 1 ? '#ced4da' : i === 2 ? '#cd7f32' : 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i < 3 ? 'white' : 'var(--text-muted)',
                fontWeight: 800
              }}>
                {i < 3 ? <Medal size={20} /> : i + 1}
              </div>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '16px' }}>{p.username}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.rank || i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Place</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '24px', fontWeight: 900, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>{p.score}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Points</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '20px' }}>
        <Button variant="primary" size="lg" onClick={() => router.push('/dashboard/create')} style={{ flex: 1, gap: '8px' }}>
          <RotateCcw size={18} /> New Challenge
        </Button>
        <Button variant="outline" size="lg" onClick={() => router.push('/dashboard')} style={{ flex: 1, gap: '8px' }}>
          <Home size={18} /> Back to Dashboard
        </Button>
      </div>

    </div>
  );
}
