import { create } from 'zustand';
import type { ConsumptionRecord, ConsumptionRecordFormData, PaginatedResponse } from '../types';
import { consumptionRecordApi } from '../services/api';

interface ConsumptionRecordState {
  records: ConsumptionRecord[];
  currentRecord: ConsumptionRecord | null;
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRecords: (customerId: number, params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) => Promise<void>;
  fetchRecord: (id: number) => Promise<void>;
  createRecord: (customerId: number, data: ConsumptionRecordFormData) => Promise<void>;
  updateRecord: (id: number, data: ConsumptionRecordFormData) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  clearError: () => void;
  clearCurrentRecord: () => void;
}

export const useConsumptionStore = create<ConsumptionRecordState>((set) => ({
  records: [],
  currentRecord: null,
  total: 0,
  page: 1,
  pageSize: 10,
  isLoading: false,
  error: null,

  fetchRecords: async (customerId: number, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await consumptionRecordApi.getCustomerRecords(customerId, params);
      const data = response.data.data as PaginatedResponse<ConsumptionRecord>;
      set({
        records: data.list,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取消费记录失败',
        isLoading: false,
      });
    }
  },

  fetchRecord: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await consumptionRecordApi.getRecord(id);
      set({
        currentRecord: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取记录详情失败',
        isLoading: false,
      });
    }
  },

  createRecord: async (customerId: number, data: ConsumptionRecordFormData) => {
    set({ isLoading: true, error: null });
    try {
      await consumptionRecordApi.createRecord(customerId, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '创建记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateRecord: async (id: number, data: ConsumptionRecordFormData) => {
    set({ isLoading: true, error: null });
    try {
      await consumptionRecordApi.updateRecord(id, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRecord: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await consumptionRecordApi.deleteRecord(id);
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
  clearCurrentRecord: () => set({ currentRecord: null }),
}));
