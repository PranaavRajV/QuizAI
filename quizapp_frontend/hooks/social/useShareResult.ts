import { useState, useCallback } from 'react';
import api from '@/lib/axios';

export function useShareResult() {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createShare = useCallback(async (attemptId: string, isPublic: boolean = false) => {
    setIsLoading(true);
    try {
      const resp = await api.post('/api/social/share/create_share/', {
        attempt_id: attemptId,
        is_public: isPublic
      });
      const token = resp.data.share_token;
      // In a real app, use the actual domain
      const url = `${window.location.origin}/share/result/${token}`;
      setShareUrl(url);
      return url;
    } catch (e: any) {
      console.error('Failed to create share link');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { shareUrl, createShare, isLoading };
}
