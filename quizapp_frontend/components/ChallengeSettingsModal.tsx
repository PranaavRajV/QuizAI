"use client";

import React, { useState } from 'react';
import { Button } from './ui-components';
import { Modal } from './quiz-components';
import { Clock, Users, Target, Swords, CheckSquare, Type } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: any) => void;
  isLoading: boolean;
  quizTopic: string;
}

export function ChallengeSettingsModal({ isOpen, onClose, onConfirm, isLoading, quizTopic }: Props) {
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<('mcq' | 'typed')[]>(['mcq']);

  const toggleType = (type: 'mcq' | 'typed') => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter(t => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      max_participants: maxParticipants,
      time_per_question: timePerQuestion,
      points_per_question: pointsPerQuestion,
      question_types: questionTypes,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Battle Settings"
      footer={
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <Button variant="outline" onClick={onClose} disabled={isLoading} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
            isLoading={isLoading}
            style={{ flex: 2, background: 'var(--warn)', color: 'white', border: 'none', gap: '8px' }}
          >
            <Swords size={16} /> Create Battle Room
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px' }}>
        
        <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Quiz Selected</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{quizTopic}</p>
        </div>

        {/* Time per question */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Time (sec)
            </label>
            <input 
              type="number" 
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={14} /> Points
            </label>
            <input 
              type="number" 
              value={pointsPerQuestion}
              onChange={(e) => setPointsPerQuestion(parseInt(e.target.value))}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Max Participants */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} /> Max Participants
          </label>
          <input 
            type="number" 
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

      </div>
    </Modal>
  );
}
