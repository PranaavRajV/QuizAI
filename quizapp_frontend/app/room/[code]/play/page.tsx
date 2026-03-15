"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui-components';
import { Timer, Brain, Users, ChevronRight, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Quiz, Question, Room } from '@/types/api';

export default function MultiplayerPlayPage() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user, accessToken } = useAuthStore();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    if (!accessToken || !code) return;

    // Fetch quiz data via API first
    const loadData = async () => {
        try {
            const roomResp = await api.get(`/api/quizzes/rooms/${code}/`);
            setRoom(roomResp.data);
            
            const quizResp = await api.get(`/api/quizzes/${roomResp.data.quiz}/`);
            setQuiz(quizResp.data);
        } catch (e) {
            console.error("Failed to load room data", e);
        }
    };
    loadData();

    // Setup Socket
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/room/${code}/?token=${accessToken}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'room_update') {
        setResults(data.data.participants.sort((a: any, b: any) => b.score - a.score));
        if (data.data.status === 'completed') {
            router.push(`/room/${code}/results`);
        }
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [code, accessToken]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    if (!socket || !quiz) return;
    const question = quiz.questions![currentIdx];
    const isTyped = question.type === 'typed';

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

    socket.send(JSON.stringify({
      action: 'submit_answer',
      question_id: question.id,
      choice_id: isTyped ? null : selectedChoiceId,
      typed_answer: isTyped ? typedAnswer : null,
      time_taken: timeTaken
    }));

    if (currentIdx < quiz.questions!.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedChoiceId(null);
      setTypedAnswer('');
      setQuestionStartTime(Date.now());
    } else {
      // Completed local questions, wait for others or final status
      router.push(`/room/${code}/results`);
    }
  };

  if (!quiz || !room) return <div style={{ textAlign: 'center', padding: '100px' }}>Loading Quiz...</div>;

  const currentQuestion = quiz.questions![currentIdx];
  const progress = ((currentIdx + 1) / quiz.questions!.length) * 100;

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
      
      {/* Left: Quiz Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Brain size={20} color="var(--accent)" />
             <span style={{ fontWeight: 700, fontSize: '15px' }}>{quiz.topic}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <Timer size={16} /> {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.4, marginBottom: '32px' }}>{currentQuestion.question_text}</h2>

          {currentQuestion.type === 'typed' ? (
            <textarea
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Type your answer..."
              style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQuestion.choices.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChoiceId(c.id)}
                  style={{
                    padding: '16px 20px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                    border: `1px solid ${selectedChoiceId === c.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedChoiceId === c.id ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    color: selectedChoiceId === c.id ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {c.choice_text}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="lg" onClick={handleSubmit} style={{ minWidth: '160px', gap: '8px' }}>
            {currentIdx === quiz.questions!.length - 1 ? 'Finish Challenge' : 'Next Question'} <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Right: Live Leaderboard */}
      <aside style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={16} color="var(--warn)" />
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leaderboard</h3>
        </div>
        <div style={{ padding: '8px 0' }}>
            {results.length > 0 ? results.map((p, i) => (
                <div key={p.username} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i === results.length - 1 ? 'none' : '1px solid var(--border)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', width: '15px' }}>{i + 1}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: p.username === user?.username ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {p.username}
                      </span>
                   </div>
                   <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{p.score}</span>
                </div>
            )) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Waiting for scores...</div>
            )}
        </div>
      </aside>

    </div>
  );
}
