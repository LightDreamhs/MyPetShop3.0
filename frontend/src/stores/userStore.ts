import { create } from 'zustand';
import type { User, UserFormData, PaginatedResponse } from '../types';
import { userApi } from '../services/api';

interface UserState {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: (params?: { page?: number; pageSize?: number; search?: string }) => Promise<void>;
  createUser: (data: UserFormData) => Promise<void>;
  updateUser: (id: number, data: UserFormData) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  total: 0,
  page: 1,
  pageSize: 10,
  isLoading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userApi.getUsers(params);
      const data = response.data.data as PaginatedResponse<User>;
      set({
        users: data.list,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取用户列表失败',
        isLoading: false,
      });
    }
  },

  createUser: async (data: UserFormData) => {
    set({ isLoading: true, error: null });
    try {
      await userApi.createUser(data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '创建用户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateUser: async (id: number, data: UserFormData) => {
    set({ isLoading: true, error: null });
    try {
      await userApi.updateUser(id, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新用户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await userApi.deleteUser(id);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '删除用户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
