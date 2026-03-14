import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { SocialUser } from '@/types/social';

export function useLeaderboard(type: 'global' | 'friends' | 'weekly' = 'global') {
  const [data, setData] = useState<SocialUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      let endpoint = '/api/social/leaderboard/global_rank/';
      if (type === 'friends') endpoint = '/api/social/leaderboard/friends/';
      if (type === 'weekly') endpoint = '/api/social/leaderboard/weekly/';
      
      const resp = await api.get(endpoint);
      setData(resp.data);
    } catch (e: any) {
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { data, isLoading, error, refetch: fetchLeaderboard };
}

export function useMyRank() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRank = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await api.get('/api/social/leaderboard/me/');
      setData(resp.data);
    } catch (e: any) {
      setError('No ranking available');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  return { data, isLoading, error, refetch: fetchRank };
}
