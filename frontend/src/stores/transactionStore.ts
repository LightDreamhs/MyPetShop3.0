import { create } from 'zustand';
import type { Transaction, TransactionFormData, TransactionStatistics, PaginatedResponse } from '../types';
import { transactionApi } from '../services/api';

interface TransactionState {
  transactions: Transaction[];
  statistics: TransactionStatistics | null;
  currentTransaction: Transaction | null;
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTransactions: (params?: { page?: number; pageSize?: number; type?: string; startDate?: string; endDate?: string }) => Promise<void>;
  fetchStatistics: (params?: { startDate?: string; endDate?: string }) => Promise<void>;
  fetchTransaction: (id: number) => Promise<void>;
  createTransaction: (data: TransactionFormData) => Promise<void>;
  updateTransaction: (id: number, data: TransactionFormData) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  clearError: () => void;
  clearCurrentTransaction: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  statistics: null,
  currentTransaction: null,
  total: 0,
  page: 1,
  pageSize: 10,
  isLoading: false,
  error: null,

  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.getTransactions(params);
      const data = response.data.data as PaginatedResponse<Transaction>;
      set({
        transactions: data.list,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取财务记录失败',
        isLoading: false,
      });
    }
  },

  fetchStatistics: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.getStatistics(params);
      set({
        statistics: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取统计信息失败',
        isLoading: false,
      });
    }
  },

  fetchTransaction: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.getTransaction(id);
      set({
        currentTransaction: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取记录详情失败',
        isLoading: false,
      });
    }
  },

  createTransaction: async (data: TransactionFormData) => {
    set({ isLoading: true, error: null });
    try {
      await transactionApi.createTransaction(data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '创建记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateTransaction: async (id: number, data: TransactionFormData) => {
    set({ isLoading: true, error: null });
    try {
      await transactionApi.updateTransaction(id, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteTransaction: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await transactionApi.deleteTransaction(id);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '删除记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentTransaction: () => set({ currentTransaction: null }),
}));
