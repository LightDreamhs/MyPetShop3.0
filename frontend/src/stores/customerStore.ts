import { create } from 'zustand';
import type { Customer, CustomerFormData, PaginatedResponse } from '../types';
import { customerApi } from '../services/api';

interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCustomers: (params?: { page?: number; pageSize?: number; search?: string; memberLevel?: number }) => Promise<void>;
  fetchCustomer: (id: number) => Promise<void>;
  createCustomer: (data: CustomerFormData) => Promise<void>;
  updateCustomer: (id: number, data: CustomerFormData) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  clearError: () => void;
  clearCurrentCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  currentCustomer: null,
  total: 0,
  page: 1,
  pageSize: 10,
  isLoading: false,
  error: null,

  fetchCustomers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await customerApi.getCustomers(params);
      const data = response.data.data as PaginatedResponse<Customer>;
      set({
        customers: data.list,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取客户列表失败',
        isLoading: false,
      });
    }
  },

  fetchCustomer: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await customerApi.getCustomer(id);
      set({
        currentCustomer: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取客户详情失败',
        isLoading: false,
      });
    }
  },

  createCustomer: async (data: CustomerFormData) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.createCustomer(data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '创建客户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateCustomer: async (id: number, data: CustomerFormData) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.updateCustomer(id, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新客户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCustomer: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await customerApi.deleteCustomer(id);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '删除客户失败',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentCustomer: () => set({ currentCustomer: null }),
}));
