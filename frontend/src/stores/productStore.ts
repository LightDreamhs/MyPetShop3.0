import { create } from 'zustand';
import type { Product, ProductFormData, PaginatedResponse } from '../types';
import { productApi } from '../services/api';

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProducts: (params?: { page?: number; pageSize?: number; search?: string }) => Promise<void>;
  fetchProduct: (id: number) => Promise<void>;
  createProduct: (data: ProductFormData) => Promise<void>;
  updateProduct: (id: number, data: ProductFormData) => Promise<void>;
  updateStock: (id: number, stock: number) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  clearError: () => void;
  clearCurrentProduct: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  currentProduct: null,
  total: 0,
  page: 1,
  pageSize: 10,
  isLoading: false,
  error: null,

  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productApi.getProducts(params);
      const data = response.data.data as PaginatedResponse<Product>;
      set({
        products: data.list,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取商品列表失败',
        isLoading: false,
      });
    }
  },

  fetchProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productApi.getProduct(id);
      set({
        currentProduct: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取商品详情失败',
        isLoading: false,
      });
    }
  },

  createProduct: async (data: ProductFormData) => {
    set({ isLoading: true, error: null });
    try {
      await productApi.createProduct(data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '创建商品失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProduct: async (id: number, data: ProductFormData) => {
    set({ isLoading: true, error: null });
    try {
      await productApi.updateProduct(id, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新商品失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateStock: async (id: number, stock: number) => {
    set({ isLoading: true, error: null });
    try {
      await productApi.updateStock(id, stock);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新库存失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await productApi.deleteProduct(id);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '删除商品失败',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentProduct: () => set({ currentProduct: null }),
}));
