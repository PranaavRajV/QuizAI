import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import { User, LoginResponse } from '@/types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loadUserFromStorage: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post<LoginResponse>('/api/users/auth/login/', { email, password });
          const { access, refresh, user } = response.data;
          
          set({ user, accessToken: access, isLoading: false });
          
          Cookies.set('accessToken', access, { expires: 1/96 }); // 15 mins
          Cookies.set('refreshToken', refresh, { expires: 7 });  // 7 days
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      googleLogin: async (token: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post<LoginResponse>('/api/users/auth/google/', { token });
          const { access, refresh, user } = response.data;
          
          set({ user, accessToken: access, isLoading: false });
          
          Cookies.set('accessToken', access, { expires: 1/96 });
          Cookies.set('refreshToken', refresh, { expires: 7 });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await api.post('/api/users/auth/register/', data);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          api.post('/api/users/auth/logout/', { refresh: refreshToken }).catch(() => {});
        }
        set({ user: null, accessToken: null });
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.removeItem('quiz_tokens');
        // Clear theme or other local storage if needed
        window.location.href = '/login';
      },

      refreshToken: async () => {
        const refresh = Cookies.get('refreshToken');
        if (!refresh) return;

        try {
          const response = await api.post('/api/token/refresh/', { refresh });
          const { access } = response.data;
          set({ accessToken: access });
          Cookies.set('accessToken', access, { expires: 1/96 });
        } catch (error) {
          get().logout();
        }
      },

      loadUserFromStorage: () => {
        // Hydration handled by middleware
      },
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'quiz_tokens',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);
