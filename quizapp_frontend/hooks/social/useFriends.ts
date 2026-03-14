import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Friendship, SocialUser } from '@/types/social';

export function useFriends() {
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendsResp, requestsResp, suggestionsResp] = await Promise.all([
        api.get('/api/social/friends/list_friends/'),
        api.get('/api/social/friends/requests/'),
        api.get('/api/social/friends/suggestions/'),
      ]);
      setFriends(friendsResp.data);
      setRequests(requestsResp.data);
      setSuggestions(suggestionsResp.data);
    } catch (e: any) {
      setError('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = async (to_user_id: string | number) => {
    // Ensure numeric ID — Django ORM rejects string IDs with 400
    const numericId = Number(to_user_id);
    if (!numericId) throw new Error('Invalid user ID');
    const resp = await api.post('/api/social/friends/request/', { to_user_id: numericId });
    await fetchFriends();
    return resp.data;
  };

  const acceptRequest = async (id: number) => {
    const resp = await api.post(`/api/social/friends/${id}/accept/`);
    await fetchFriends();
    return resp.data;
  };

  const declineRequest = async (id: number) => {
    const resp = await api.post(`/api/social/friends/${id}/decline/`);
    await fetchFriends();
    return resp.data;
  };

  const removeFriend = async (userId: number) => {
    await api.post('/api/social/friends/remove/', { user_id: userId });
    await fetchFriends();
  };

  return { friends, requests, suggestions, isLoading, error, fetchFriends, sendRequest, acceptRequest, declineRequest, removeFriend };
}
