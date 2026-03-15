import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { Quiz, PaginatedResponse, QuizAttempt, User, CreateQuizPayload } from '@/types/api';

/**
 * 1. useAuth()
 */
export function useAuth() {
  const { user, login, logout, register, isLoading } = useAuthStore();
  // Auth is a bit special as it manages global state, but we return the requested items
  return { 
    data: user, 
    isLoading, 
    error: null, // Errors are usually handled locally in forms for auth
    login, 
    logout, 
    register 
  };
}

/**
 * 2. useQuizzes()
 */
export function useQuizzes(page = 1) {
  const [data, setData] = useState<PaginatedResponse<Quiz> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/api/quizzes/?page=${page}`);
      setData(resp.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to fetch quizzes');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const deleteQuiz = async (quizId: number) => {
    await api.delete(`/api/quizzes/${quizId}/`);
    await refetch();
  };

  return { data, isLoading, error, refetch, deleteQuiz };
}

/**
 * 3. useCreateQuiz()
 */
export function useCreateQuiz() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Quiz | null>(null);

  const createQuiz = async (payload: CreateQuizPayload, timeoutOverride?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.post<Quiz>('/api/quizzes/', payload, {
        timeout: timeoutOverride || undefined
      });
      setData(resp.data);
      return resp.data;
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to generate quiz';
      setError(msg);
      // Store the specific code if available for the component to use
      if (e.response?.data?.code) {
        (e as any).errorCode = e.response?.data?.code;
      }
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { createQuiz, isLoading, error, data };
}

/**
 * 4. useQuiz(id)
 */
export function useQuiz(id: string | null) {
  const [data, setData] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/api/quizzes/${id}/`);
      setData(resp.data);
    } catch (e: any) {
      setError('Quiz not found');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * 5. useAttempt(id)
 */
export function useAttempt(id: string | null) {
  const [data, setData] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/api/quizzes/attempts/${id}/results/`);
      setData(resp.data);
    } catch (e: any) {
      setError('Results not available');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * 6. useHistory()
 */
export function useHistory(page = 1) {
  const [data, setData] = useState<PaginatedResponse<QuizAttempt> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/api/history/?page=${page}`);
      setData(resp.data);
    } catch (e: any) {
      setError('Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * 7. useSharedQuiz(token)
 */
export function useSharedQuiz(token: string | null) {
  const [data, setData] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      // Use the public sharing endpoint
      const resp = await api.get(`/api/social/public-share/${token}/`);
      setData(resp.data);
    } catch (e: any) {
      setError('Quiz not found or link expired');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * 8. useAnalytics()
 */
export function useAnalytics() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.get('/api/quizzes/analytics/');
      setData(resp.data);
    } catch (e: any) {
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
/**
 * 9. useUpdateProfile()
 */
export function useUpdateProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser } = useAuthStore();

  const updateProfile = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.patch('/api/users/auth/me/', data);
      // If it's a general profile update, update the user store
      if (!data.new_password && resp.data.id) {
        setUser(resp.data);
      }
      return resp.data;
    } catch (e: any) {
      const msg = e.response?.data?.error || e.response?.data?.detail || 'Failed to update profile';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      // Let Axios automatically infer 'multipart/form-data' and generate the boundary
      const resp = await api.patch('/api/users/auth/me/', formData);
      if (resp.data.id) setUser(resp.data);
      return resp.data;
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to upload avatar';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const removeAvatar = async () => {

    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.patch('/api/users/auth/me/', { avatar: null });
      if (resp.data.id) setUser(resp.data);
      return resp.data;
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to remove avatar';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, uploadAvatar, removeAvatar, isLoading, error };
}


/**
 * 10. useNotifications()
 */
export function useNotifications() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await api.get('/api/notifications/');
      setData(resp.data.results || resp.data);
    } catch (e: any) {
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all/');
      refetch();
    } catch (e) {
      console.error('Failed to mark all as read');
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/read/`);
      refetch();
    } catch (e) {
      console.error('Failed to mark notification as read');
    }
  };

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 30000); // 30s
    return () => clearInterval(interval);
  }, [refetch]);

  return { data, isLoading, error, refetch, markAllAsRead, markAsRead };
}

/**
 * 11. usePushNotifications()
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return 'denied';
    const res = await Notification.requestPermission();
    setPermission(res);
    return res;
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  };

  return { isSupported, permission, requestPermission, sendNotification };
}

/**
 * 11. useSearchQuizzes(query)
 */
export function useSearchQuizzes(query: string) {
  const [results, setResults] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const resp = await api.get(`/api/quizzes/?search=${query}`);
        setResults(resp.data.results || []);
      } catch (e) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, isLoading };
}
