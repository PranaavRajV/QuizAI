"use client";

import React, { useState } from 'react';
import { Button } from './ui-components';
import { Modal } from './quiz-components';
import { Settings, Brain, Clock, Users, Target, CheckSquare, Type } from 'lucide-react';
import { QuizConfig } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: QuizConfig) => void;
  isGenerating: boolean;
}

export function QuizCustomizationModal({ isOpen, onClose, onGenerate, isGenerating }: Props) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<('mcq' | 'typed')[]>(['mcq']);
  const [progress, setProgress] = useState(0);

  // Fake progress bar logic
  React.useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 1500);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const toggleType = (type: 'mcq' | 'typed') => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter(t => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const handleGenerate = () => {
    if (!topic.trim()) return;
    onGenerate({
      topic,
      difficulty,
      num_questions: numQuestions,
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
      title="Customize Your Quiz"
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                  Generating Quiz...
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Est. 10–25 seconds
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: 'var(--accent)', 
                  transition: 'width 1s ease-out' 
                }} />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <Button variant="outline" onClick={onClose} disabled={isGenerating} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleGenerate} 
              isLoading={isGenerating}
              disabled={!topic.trim() || isGenerating}
              style={{ flex: 2, background: 'var(--accent)', color: 'white' }}
            >
              Start Generation
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px' }}>
        
        {/* Topic Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Brain size={14} /> Topic or Subject
          </label>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Quantum Physics, Taylor Swift, World History..."
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Difficulty */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={14} /> Difficulty
            </label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Number of Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={14} /> Questions
            </label>
            <input 
              type="number" 
              min={5} 
              max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
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

        {/* Question Types */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Question Types</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => toggleType('mcq')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${questionTypes.includes('mcq') ? 'var(--accent)' : 'var(--border)'}`,
                background: questionTypes.includes('mcq') ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                color: questionTypes.includes('mcq') ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <CheckSquare size={14} /> Multiple Choice
            </button>
            <button
              onClick={() => toggleType('typed')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${questionTypes.includes('typed') ? 'var(--accent)' : 'var(--border)'}`,
                background: questionTypes.includes('typed') ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                color: questionTypes.includes('typed') ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Type size={14} /> Typed Answer
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
           {/* Time per question */}
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

          {/* Points per question */}
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

        {/* Max Participants (for multiplayer) */}
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
