export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
  updatedAt?: string;
}

export interface UserFormData {
  username?: string;
  nickname: string;
  avatar?: string;
  role?: 'ADMIN' | 'STAFF';
}

export interface ProfileFormData {
  nickname: string;
  avatar?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface Product {
  id: number;
  name: string;
  price: number | null;
  stock: number;
  imageUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  description?: string;
}

export interface Customer {
  id: number;
  petName: string;
  ownerName: string;
  phone: string;
  memberLevel: number; // 0=非会员 1=初级 2=中级 3=高级 4=至尊
  balance?: number; // 会员余额（单位：分）
  avatar?: string;
  petType?: string;
  breed?: string;
  age?: number;
  gender?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  petName: string;
  ownerName: string;
  phone: string;
  memberLevel: number; // 0=非会员 1=初级 2=中级 3=高级 4=至尊
  avatar?: string;
  petType?: string;
  breed?: string;
  age?: number;
  gender?: string;
  notes?: string;
}

export interface ConsumptionRecord {
  id: number;
  customerId: number;
  date: string;
  item: string;
  problem?: string;
  suggestion?: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumptionRecordFormData {
  date: string;
  item: string;
  problem?: string;
  suggestion?: string;
  amount?: number;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

export interface TransactionStatistics {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  incomeCount: number;
  expenseCount: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

export interface BalanceTransaction {
  id: number;
  customerId: number;
  type: 'RECHARGE' | 'DEDUCT' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  operatorId?: number;
  operatorName?: string; // 操作人名称
  createdAt: string;
}

export interface BalanceRechargeRequest {
  amount: number;
  description?: string;
}

export interface BalanceDeductRequest {
  amount: number;
  description?: string;
}

