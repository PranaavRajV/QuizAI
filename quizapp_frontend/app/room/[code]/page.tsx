"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui-components';
import { Users, Crown, CheckCircle2, Circle, Play, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function WaitingRoomPage() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user, accessToken } = useAuthStore();
  const [roomData, setRoomData] = useState<any>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!accessToken || !code) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/room/${code}/?token=${accessToken}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("Connected to room");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'room_update') {
        setRoomData(data.data);
      } else if (data.type === 'quiz_started') {
        router.push(`/room/${code}/play`);
      }
    };
    ws.onerror = (err) => {
      console.error("WS Error", err);
      toast.error("Connection error");
    };
    ws.onclose = () => console.log("Disconnected");

    setSocket(ws);
    return () => ws.close();
  }, [code, token]);

  const toggleReady = () => {
    if (!socket || !roomData) return;
    const participant = roomData.participants.find((p: any) => p.username === user?.username);
    socket.send(JSON.stringify({
      action: 'ready',
      is_ready: !participant?.is_ready
    }));
  };

  const startQuiz = () => {
    if (!socket) return;
    const allReady = roomData.participants.every((p: any) => p.is_ready || p.is_host);
    if (!allReady) {
      toast.error("Wait for everyone to be ready!");
      return;
    }
    socket.send(JSON.stringify({ action: 'start_quiz' }));
  };

  if (!roomData) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Joining Room...</div>;

  const isHost = roomData.host_id === user?.id;
  const myParticipant = roomData.participants.find((p: any) => p.username === user?.username);

  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
           <ArrowLeft size={16} /> Dashboard
        </Button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{roomData.topic}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Room Code: <strong style={{ color: 'var(--accent)' }}>{code}</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Participants List */}
        <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--text-secondary)" />
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participants ({roomData.participants.length})</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {roomData.participants.map((p: any) => (
              <div key={p.username} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.is_host ? <Crown size={14} color="var(--warn)" /> : <Users size={14} color="var(--text-muted)" />}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{p.username} {p.username === user?.username && "(You)"}</span>
                    {p.is_host && <span style={{ fontSize: '10px', color: 'var(--warn)', fontWeight: 700, textTransform: 'uppercase', marginLeft: '6px' }}>Host</span>}
                  </div>
                </div>
                {p.is_ready ? <CheckCircle2 size={18} color="var(--success)" /> : <Circle size={18} color="var(--border)" />}
              </div>
            ))}
          </div>
        </section>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center' }}>
             <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
               {isHost ? "Wait for all players to be ready before starting." : "Click 'Ready' to let the host know you're set!"}
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <Button 
                variant={myParticipant?.is_ready ? "outline" : "primary"} 
                size="lg" 
                onClick={toggleReady}
                style={{ width: '100%' }}
               >
                 {myParticipant?.is_ready ? "Not Ready" : "Ready Up"}
               </Button>
               {isHost && (
                 <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={startQuiz}
                    style={{ width: '100%', background: 'var(--success)', color: 'white', border: 'none' }}
                 >
                   <Play size={16} /> Start Quiz
                 </Button>
               )}
             </div>
          </div>

          <div style={{ background: 'var(--accent)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Invite Friends</h4>
            <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '12px' }}>Share the room code below to let friends join your quiz.</p>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>
              {code}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
