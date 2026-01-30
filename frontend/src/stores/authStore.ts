import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  isAdmin: () => boolean;
  hasRole: (role: 'ADMIN' | 'STAFF') => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(username);
          const { user, accessToken } = response.data.data;
          // 同时存储到 localStorage（供 axios 拦截器使用）和 zustand state（供组件使用）
          localStorage.setItem('access_token', accessToken);
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '登录失败',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('登出请求失败:', error);
        } finally {
          // 清除 localStorage 和 zustand state
          localStorage.removeItem('access_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.getCurrentUser();
          const user = response.data.data;
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // Token 过期或无效，清除所有状态和 localStorage
          localStorage.removeItem('access_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          // 强制跳转到登录页
          window.location.href = '/login';
        }
      },

      clearError: () => set({ error: null }),

      isAdmin: () => {
        const state = get();
        return state.user?.role === 'ADMIN';
      },

      hasRole: (role: 'ADMIN' | 'STAFF') => {
        const state = get();
        return state.user?.role === role;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
