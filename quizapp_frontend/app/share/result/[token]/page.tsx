"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, Button } from '@/components/ui-components';
import { CircularScore } from '@/components/quiz-components';
import { Trophy, Share2, LogIn, Sparkles } from 'lucide-react';

export default function PublicSharePage() {
  const { token } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const resp = await axios.get(`${apiUrl}/api/social/share/public-share/${token}/`);
        setData(resp.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchShare();
  }, [token]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-[#64748b]">Loading result...</div>;
  if (!data) return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-red-500">Result link is invalid or expired.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_0%,#1e293b,transparent)]">
      <div className="w-full max-w-[500px] space-y-10">
        <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                    <Trophy className="w-6 h-6" />
                </div>
            </div>
            <h1 className="text-2xl font-black text-white">{data.username}'s Performance</h1>
            <p className="text-sm text-[#64748b]">Shared via QuizAI</p>
        </div>

        <Card className="p-10 border-[#2e2e32] bg-[#161618]/50 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-20 h-20 text-blue-500" />
            </div>

            <div className="flex flex-col items-center space-y-8 relative z-10">
                <CircularScore score={data.score} size={160} />
                
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-white">{data.quiz_name}</h2>
                    <p className="text-[#64748b] text-sm">Solved {data.correct_count} questions correctly</p>
                </div>

                <div className="w-full h-px bg-[#2e2e32]" />

                <div className="grid grid-cols-2 gap-10 w-full text-center">
                    <div>
                        <p className="text-2xl font-black text-white">{data.score}%</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Final Score</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-white">{data.correct_count}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Answers</p>
                    </div>
                </div>
            </div>
        </Card>

        <div className="flex flex-col gap-4">
            <Button className="w-full h-12 font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 gap-2" onClick={() => router.push('/register')}>
                <LogIn className="w-4 h-4" /> Join QuizAI & Compete
            </Button>
            <Button variant="secondary" className="w-full h-12 font-black uppercase tracking-widest text-xs border-[#2e2e32] gap-2">
                <Share2 className="w-4 h-4" /> Share This Page
            </Button>
        </div>
      </div>
    </div>
  );
}
