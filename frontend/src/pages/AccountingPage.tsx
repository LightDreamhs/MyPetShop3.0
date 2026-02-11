import React, { useState, useEffect, useCallback } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import { transactionApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { Plus, Search, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import type { TransactionFormData, Transaction, MonthlyStatistics } from '../types';
import { getCurrentLocalDateTime } from '../utils/dateFormat';

// 查询参数类型
interface TransactionQueryParams {
  page: number;
  pageSize: number;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const AccountingPage: React.FC = () => {
  const {
    transactions,
    statistics,
    total,
    page,
    pageSize,
    isLoading,
    error,
    fetchTransactions,
    fetchStatistics,
    createTransaction,
    deleteTransaction,
    clearError,
  } = useTransactionStore();

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDateFilterDialogOpen, setIsDateFilterDialogOpen] = useState(false);
  const [isNetIncomeDialogOpen, setIsNetIncomeDialogOpen] = useState(false);
  const [isMonthlyStatsDialogOpen, setIsMonthlyStatsDialogOpen] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatistics[]>([]);
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // 新增状态：搜索、日期筛选、净收入计算
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [netIncomeDays, setNetIncomeDays] = useState(7);
  const [netIncomeInputValue, setNetIncomeInputValue] = useState('7');
  const [netIncomeResult, setNetIncomeResult] = useState<{ totalIncome: number; totalExpense: number; netIncome: number } | null>(null);

  // 金额验证错误和输入框显示值
  const [amountError, setAmountError] = useState('');
  const [amountInputValue, setAmountInputValue] = useState('');

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'income',
    amount: 0,
    description: '',
    date: getCurrentLocalDateTime(),
  });

  // 使用 useCallback 优化 loadData，避免依赖项警告
  const loadData = useCallback(() => {
    const params: TransactionQueryParams = { page, pageSize };
    if (typeFilter) params.type = typeFilter;
    if (searchTerm) params.search = searchTerm;
    if (dateFilter.startDate) params.startDate = dateFilter.startDate;
    if (dateFilter.endDate) params.endDate = dateFilter.endDate;
    fetchTransactions(params);
    // 默认显示全部统计
    if (!dateFilter.startDate && !dateFilter.endDate) {
      fetchStatistics();
    }
  }, [page, pageSize, typeFilter, searchTerm, dateFilter, fetchTransactions, fetchStatistics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 按描述搜索
  const handleSearchByDescription = () => {
    fetchTransactions({ page: 1, pageSize, search: searchTerm });
  };

  // 按日期筛选
  const handleFilterByDate = () => {
    // 为日期添加时间部分，确保包含当天的数据
    const startDateWithTime = dateFilter.startDate ? `${dateFilter.startDate} 00:00:00` : undefined;
    const endDateWithTime = dateFilter.endDate ? `${dateFilter.endDate} 23:59:59` : undefined;

    fetchTransactions({
      page: 1,
      pageSize,
      startDate: startDateWithTime,
      endDate: endDateWithTime,
    });
    setIsDateFilterDialogOpen(false);
  };

  // 计算近n天净收入
  const handleCalculateNetIncome = async () => {
    // 验证并获取天数
    const days = parseInt(netIncomeInputValue);
    const validDays = (days && days >= 1 && days <= 365) ? days : 7;
    setNetIncomeDays(validDays);

    // 计算日期范围
    // 重要：使用本地时间格式，避免时区问题
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);  // 今天最后一刻

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - validDays);
    startDate.setHours(0, 0, 0, 0);  // N天前第一刻

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(todayEnd);

    console.log('统计日期范围:', startDateStr, '至', endDateStr);

    try {
      const response = await transactionApi.getStatistics({
        startDate: startDateStr,
        endDate: endDateStr
      });
      const stats = response.data.data;
      setNetIncomeResult({
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        netIncome: stats.netIncome,
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 清除日期筛选
  const handleClearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
    fetchTransactions({ page: 1, pageSize });
    fetchStatistics();
  };

  // 获取月度统计数据
  const fetchMonthlyStats = async (year: number) => {
    setIsLoadingStats(true);
    try {
      const response = await transactionApi.getMonthlyStatistics({ year });
      setMonthlyStats(response.data.data);
    } catch (error) {
      console.error('获取月度统计失败:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // 验证金额输入（宽松验证，允许输入过程中的中间状态）
  const validateAmountInput = (value: string): boolean => {
    if (value === '') {
      setAmountError('');
      return true;
    }

    if (value === '.') {
      setAmountError('');
      return true;
    }

    const amountRegex = /^\d*\.?\d{0,2}$/;
    if (!amountRegex.test(value)) {
      setAmountError('请输入数字');
      return false;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue < 0) {
      setAmountError('金额不能为负数');
      return false;
    }

    setAmountError('');
    return true;
  };

  // 金额输入框变化处理
  const handleAmountInputChange = (value: string) => {
    setAmountInputValue(value);
    validateAmountInput(value);
  };

  // 金额输入框失去焦点时，转换为实际数值
  const handleAmountInputBlur = () => {
    if (amountInputValue === '' || amountInputValue === '.') {
      setAmountInputValue('');
      setFormData({ ...formData, amount: 0 });
      return;
    }

    const numValue = parseFloat(amountInputValue);
    if (!isNaN(numValue) && numValue > 0) {
      const amountInCents = Math.round(numValue * 100);
      setFormData({ ...formData, amount: amountInCents });
      setAmountInputValue(numValue.toFixed(2));
    } else {
      setAmountInputValue('');
      setFormData({ ...formData, amount: 0 });
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      setAmountError('请输入有效的金额');
      return;
    }

    try {
      await createTransaction(formData);
      setIsAddDialogOpen(false);
      setFormData({
        type: 'income',
        amount: 0,
        description: '',
        date: getCurrentLocalDateTime(),
      });
      setAmountError('');
      setAmountInputValue('');
      loadData();
    } catch {
      // Error handled by store
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      try {
        await deleteTransaction(id);
        loadData();
      } catch {
        // Error handled by store
      }
    }
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">财务记账</h1>
        <p className="text-gray-500 mt-1">管理宠物店收支记录</p>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总收入</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{(statistics.totalIncome / 100).toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">↑</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">总支出</p>
                  <p className="text-2xl font-bold text-red-600">
                    ¥{(statistics.totalExpense / 100).toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">↓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">净收入</p>
                  <p className={`text-2xl font-bold ${statistics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ¥{(statistics.netIncome / 100).toFixed(2)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  statistics.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`text-xl ${statistics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ¥
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和操作栏 */}
      <Card className="mb-6">
        <CardContent>
          <div className="space-y-4">
            {/* 第一行：类型筛选 + 描述搜索 + 记账按钮 */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">全部记录</option>
                  <option value="income">只看收入</option>
                  <option value="expense">只看支出</option>
                </select>

                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="搜索描述..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchByDescription()}
                  />
                </div>
                <Button onClick={handleSearchByDescription}>
                  <Search size={20} className="mr-2" />
                  搜索描述
                </Button>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus size={20} className="mr-2" />
                记一笔
              </Button>
            </div>

            {/* 第二行：日期筛选 + 近n天净收入 */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="secondary"
                onClick={() => setIsDateFilterDialogOpen(true)}
              >
                <Calendar size={20} className="mr-2" />
                按日期筛选
              </Button>
              {dateFilter.startDate && dateFilter.endDate && (
                <div className="text-sm text-gray-600">
                  筛选: {dateFilter.startDate} 至 {dateFilter.endDate}
                  <button
                    onClick={handleClearDateFilter}
                    className="ml-2 text-red-600 hover:text-red-800 underline"
                  >
                    清除
                  </button>
                </div>
              )}
              <div className="flex-1"></div>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsMonthlyStatsDialogOpen(true);
                  fetchMonthlyStats(statsYear);
                }}
              >
                <BarChart3 size={20} className="mr-2" />
                查看收支情况
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsNetIncomeDialogOpen(true)}
              >
                <TrendingUp size={20} className="mr-2" />
                计算净收入
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button onClick={clearError} className="text-sm text-red-600 underline mt-2">
            关闭
          </button>
        </div>
      )}

      {/* 收支记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>收支记录 ({total} 条)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction: Transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.type === 'income' ? (
                          <span
                            className="inline-flex items-center rounded-full font-medium border text-xs px-4 py-2"
                            style={{
                              backgroundColor: '#d1fae5',
                              color: '#10b981',
                              borderColor: '#6ee7b7',
                              borderWidth: '2px',
                            }}
                          >
                            收入
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded-full font-medium border text-xs px-4 py-2"
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#ef4444',
                              borderColor: '#fca5a5',
                              borderWidth: '2px',
                            }}
                          >
                            支出
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          ¥{(transaction.amount / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {total > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(newPage) => {
                  const params: TransactionQueryParams = { page: newPage, pageSize };
                  if (typeFilter) params.type = typeFilter;
                  if (searchTerm) params.search = searchTerm;
                  if (dateFilter.startDate) params.startDate = dateFilter.startDate;
                  if (dateFilter.endDate) params.endDate = dateFilter.endDate;
                  fetchTransactions(params);
                }}
                onPageSizeChange={(newPageSize) => {
                  const params: TransactionQueryParams = { page: 1, pageSize: newPageSize };
                  if (typeFilter) params.type = typeFilter;
                  if (searchTerm) params.search = searchTerm;
                  if (dateFilter.startDate) params.startDate = dateFilter.startDate;
                  if (dateFilter.endDate) params.endDate = dateFilter.endDate;
                  fetchTransactions(params);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
                isLoading={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增记录对话框 */}
      <Dialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setFormData({
            type: 'income',
            amount: 0,
            description: '',
            date: getCurrentLocalDateTime(),
          });
          setAmountError('');
          setAmountInputValue('');
          clearError();
        }}
        title="记一笔"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  className="mr-2"
                  checked={formData.type === 'income'}
                  onChange={() => setFormData({ ...formData, type: 'income' })}
                />
                <span className="text-green-600 font-medium">收入</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  className="mr-2"
                  checked={formData.type === 'expense'}
                  onChange={() => setFormData({ ...formData, type: 'expense' })}
                />
                <span className="text-red-600 font-medium">支出</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额 (元) *</label>
            <input
              type="text"
              inputMode="decimal"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                amountError ? 'border-red-500' : 'border-gray-300'
              } [appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              value={amountInputValue}
              onChange={(e) => handleAmountInputChange(e.target.value)}
              onBlur={handleAmountInputBlur}
              placeholder="0.00"
              required
            />
            {amountError && (
              <p className="mt-1 text-sm text-red-600">{amountError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="例如: 狗粮销售"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">时间 *</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddDialogOpen(false);
                setFormData({
                  type: 'income',
                  amount: 0,
                  description: '',
                  date: getCurrentLocalDateTime(),
                });
                setAmountError('');
                setAmountInputValue('');
                clearError();
              }}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '提交中...' : '确认记录'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 日期筛选对话框 */}
      <Dialog
        isOpen={isDateFilterDialogOpen}
        onClose={() => setIsDateFilterDialogOpen(false)}
        title="按日期筛选"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDateFilterDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleFilterByDate}>
              确认筛选
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 近n天净收入对话框 */}
      <Dialog
        isOpen={isNetIncomeDialogOpen}
        onClose={() => {
          setIsNetIncomeDialogOpen(false);
          setNetIncomeResult(null);
          setNetIncomeInputValue('7');
          setNetIncomeDays(7);
        }}
        title="计算近n天净收入"
        size="sm"
      >
        <div className="space-y-4">
          {!netIncomeResult ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">天数</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={netIncomeInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 只允许输入数字，包括空字符串
                    if (/^\d*$/.test(value)) {
                      setNetIncomeInputValue(value);
                    }
                  }}
                  onBlur={() => {
                    // 失去焦点时验证并更新
                    const days = parseInt(netIncomeInputValue);
                    if (!days || days < 1 || days > 365) {
                      setNetIncomeInputValue('7');
                      setNetIncomeDays(7);
                    } else {
                      setNetIncomeDays(days);
                    }
                  }}
                  placeholder="请输入天数（1-365）"
                />
                <p className="text-xs text-gray-500 mt-1">输入1-365之间的天数</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsNetIncomeDialogOpen(false);
                    setNetIncomeDays(7);
                    setNetIncomeInputValue('7');
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleCalculateNetIncome} disabled={isLoading}>
                  {isLoading ? '计算中...' : '计算'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">近{netIncomeDays}天总收入</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{(netIncomeResult.totalIncome / 100).toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">近{netIncomeDays}天总支出</p>
                  <p className="text-2xl font-bold text-red-600">
                    ¥{(netIncomeResult.totalExpense / 100).toFixed(2)}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${netIncomeResult.netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">近{netIncomeDays}天净收入</p>
                  <p className={`text-3xl font-bold ${netIncomeResult.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ¥{(netIncomeResult.netIncome / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setNetIncomeResult(null);
                  }}
                >
                  重新计算
                </Button>
                <Button
                  onClick={() => {
                    setIsNetIncomeDialogOpen(false);
                    setNetIncomeResult(null);
                    setNetIncomeDays(7);
                    setNetIncomeInputValue('7');
                  }}
                >
                  关闭
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* 月度收支情况对话框 */}
      <Dialog
        isOpen={isMonthlyStatsDialogOpen}
        onClose={() => setIsMonthlyStatsDialogOpen(false)}
        title="月度收支情况"
        size="md"
      >
        <div className="space-y-4">
          {/* 年份选择 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">选择年份:</label>
            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg"
              value={statsYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                setStatsYear(year);
                fetchMonthlyStats(year);
              }}
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>

          {/* 加载状态 */}
          {isLoadingStats ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            /* 统计列表 */
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {monthlyStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无数据</div>
              ) : (
                monthlyStats.map((stat) => (
                  <div key={stat.yearMonth} className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">{stat.yearMonth}</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">收入：</span>
                        <span className="text-green-600 font-medium">
                          ¥{(stat.totalIncome / 100).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">支出：</span>
                        <span className="text-red-600 font-medium">
                          ¥{(stat.totalExpense / 100).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">总收支：</span>
                        <span className={`font-medium ${stat.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ¥{(stat.netIncome / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="secondary"
            onClick={() => setIsMonthlyStatsDialogOpen(false)}
          >
            关闭
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
