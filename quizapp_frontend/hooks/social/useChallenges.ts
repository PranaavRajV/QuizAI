import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Challenge } from '@/types/social';

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await api.get('/api/social/challenges/');
      const data = resp.data;
      setChallenges(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (e: any) {
      setError('Failed to load challenges');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const sendChallenge = async (data: { challenged_user_id: string, topic: string, difficulty: string, num_questions: number }) => {
    try {
      await api.post('/api/social/challenges/', data);
      await fetchChallenges();
    } catch (e) {
      console.error(e);
    }
  };

  const acceptChallenge = async (id: number) => {
    try {
      const resp = await api.post(`/api/social/challenges/${id}/accept/`);
      await fetchChallenges();
      return resp.data;
    } catch (e) {
      console.error(e);
    }
  };

  return { challenges, isLoading, error, fetchChallenges, sendChallenge, acceptChallenge };
}
