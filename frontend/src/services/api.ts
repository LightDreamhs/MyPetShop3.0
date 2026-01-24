import axiosInstance from '../lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserFormData,
  LoginResponse,
  Product,
  ProductFormData,
  Customer,
  CustomerFormData,
  ConsumptionRecord,
  ConsumptionRecordFormData,
  Transaction,
  TransactionFormData,
  TransactionStatistics,
  UploadResponse,
} from '../types';

// ==================== 认证模块 ====================

export const authApi = {
  // 登录
  login: (username: string) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', { username }),

  // 获取当前用户信息
  getCurrentUser: () =>
    axiosInstance.get<ApiResponse<User>>('/auth/me'),

  // 登出
  logout: () =>
    axiosInstance.post<ApiResponse<null>>('/auth/logout'),
};

// ==================== 用户管理模块 ====================

export const userApi = {
  // 获取用户列表
  getUsers: (params?: { page?: number; pageSize?: number; search?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<User>>>('/users', { params }),

  // 获取用户详情
  getUser: (id: number) =>
    axiosInstance.get<ApiResponse<User>>(`/users/${id}`),

  // 创建用户
  createUser: (data: UserFormData) =>
    axiosInstance.post<ApiResponse<User>>('/users', data),

  // 更新用户
  updateUser: (id: number, data: UserFormData) =>
    axiosInstance.put<ApiResponse<User>>(`/users/${id}`, data),

  // 删除用户
  deleteUser: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/users/${id}`),
};

// ==================== 库存管理模块 ====================

export const productApi = {
  // 获取商品列表
  getProducts: (params?: { page?: number; pageSize?: number; search?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Product>>>('/products', { params }),

  // 获取商品详情
  getProduct: (id: number) =>
    axiosInstance.get<ApiResponse<Product>>(`/products/${id}`),

  // 创建商品
  createProduct: (data: ProductFormData) =>
    axiosInstance.post<ApiResponse<Product>>('/products', data),

  // 更新商品
  updateProduct: (id: number, data: ProductFormData) =>
    axiosInstance.put<ApiResponse<Product>>(`/products/${id}`, data),

  // 修改商品库存
  updateStock: (id: number, stock: number) =>
    axiosInstance.patch<ApiResponse<{ id: number; stock: number }>>(`/products/${id}/stock`, { stock }),

  // 删除商品
  deleteProduct: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/products/${id}`),
};

// ==================== 客户管理模块 ====================

export const customerApi = {
  // 获取客户列表
  getCustomers: (params?: { page?: number; pageSize?: number; search?: string; isMember?: boolean }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params }),

  // 获取客户详情
  getCustomer: (id: number) =>
    axiosInstance.get<ApiResponse<Customer>>(`/customers/${id}`),

  // 创建客户
  createCustomer: (data: CustomerFormData) =>
    axiosInstance.post<ApiResponse<Customer>>('/customers', data),

  // 更新客户信息
  updateCustomer: (id: number, data: CustomerFormData) =>
    axiosInstance.put<ApiResponse<Customer>>(`/customers/${id}`, data),

  // 删除客户
  deleteCustomer: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/customers/${id}`),
};

// ==================== 消费记录模块 ====================

export const consumptionRecordApi = {
  // 获取客户消费记录列表
  getCustomerRecords: (customerId: number, params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<ConsumptionRecord>>>(`/customers/${customerId}/consumption-records`, { params }),

  // 获取消费记录详情
  getRecord: (id: number) =>
    axiosInstance.get<ApiResponse<ConsumptionRecord>>(`/consumption-records/${id}`),

  // 创建消费记录
  createRecord: (customerId: number, data: ConsumptionRecordFormData) =>
    axiosInstance.post<ApiResponse<ConsumptionRecord>>(`/customers/${customerId}/consumption-records`, data),

  // 更新消费记录
  updateRecord: (id: number, data: ConsumptionRecordFormData) =>
    axiosInstance.put<ApiResponse<ConsumptionRecord>>(`/consumption-records/${id}`, data),

  // 删除消费记录
  deleteRecord: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/consumption-records/${id}`),
};

// ==================== 财务记账模块 ====================

export const transactionApi = {
  // 获取财务记录列表
  getTransactions: (params?: { page?: number; pageSize?: number; type?: string; startDate?: string; endDate?: string; search?: string }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Transaction>>>('/transactions', { params }),

  // 获取财务记录详情
  getTransaction: (id: number) =>
    axiosInstance.get<ApiResponse<Transaction>>(`/transactions/${id}`),

  // 创建财务记录
  createTransaction: (data: TransactionFormData) =>
    axiosInstance.post<ApiResponse<Transaction>>('/transactions', data),

  // 更新财务记录
  updateTransaction: (id: number, data: TransactionFormData) =>
    axiosInstance.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),

  // 删除财务记录
  deleteTransaction: (id: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/transactions/${id}`),

  // 获取财务统计
  getStatistics: (params?: { startDate?: string; endDate?: string }) =>
    axiosInstance.get<ApiResponse<TransactionStatistics>>('/transactions/statistics', { params }),
};

// ==================== 文件上传模块 ====================

export const uploadApi = {
  // 上传图片
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<ApiResponse<UploadResponse>>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
