import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../stores/customerStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { createPreventWheelRef } from '../utils/inputHandlers';
import { Card, CardContent } from '../components/ui/Card';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Pagination } from '../components/ui/Pagination';
import { Search, Plus, Edit, X, Check, Trash2, Wallet, History } from 'lucide-react';
import { MEMBER_LEVELS, getMemberLevelLabel, getMemberLevelColor, getMemberLevelBgColor, getMemberLevelBorderColor, isMember } from '../utils/memberLevel';
import type { Customer, CustomerFormData, BalanceTransaction } from '../types';
import { customerApi } from '../services/api';
import { ConsumptionRecordForm } from '../components/ConsumptionRecordForm';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    customers,
    total,
    page,
    pageSize,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError,
  } = useCustomerStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'member' | 'non-member'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 余额相关状态
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [balanceDialogType, setBalanceDialogType] = useState<'recharge' | 'deduct'>('recharge');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');
  // 保存当前操作的客户快照，避免 selectedCustomer 被清空导致问题
  const [balanceOperationCustomer, setBalanceOperationCustomer] = useState<Customer | null>(null);
  const [isBalanceHistoryOpen, setIsBalanceHistoryOpen] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState<BalanceTransaction[]>([]);
  const [balanceHistoryPage, setBalanceHistoryPage] = useState(1);
  const [balanceHistoryTotal, setBalanceHistoryTotal] = useState(0);
  const [isConsumptionDialogOpen, setIsConsumptionDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CustomerFormData>({
    petName: '',
    ownerName: '',
    phone: '',
    memberLevel: 0,
    avatar: '',
    petType: '',
    breed: '',
    age: undefined,
    gender: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [page, pageSize]);

  // ESC 键处理 - 按正确顺序关闭对话框
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // 优先关闭内层对话框
        if (isConsumptionDialogOpen) {
          setIsConsumptionDialogOpen(false);
        } else if (isBalanceDialogOpen) {
          setIsBalanceDialogOpen(false);
          setBalanceAmount('');
          setBalanceDescription('');
        } else if (isBalanceHistoryOpen) {
          setIsBalanceHistoryOpen(false);
        } else if (isDetailDialogOpen) {
          setIsDetailDialogOpen(false);
          setIsEditMode(false);
          setSelectedCustomer(null);
          resetFormData();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isConsumptionDialogOpen, isBalanceDialogOpen, isBalanceHistoryOpen, isDetailDialogOpen]);

  // 监听充值对话框打开状态，验证客户信息
  useEffect(() => {
    if (isBalanceDialogOpen) {
      // 使用客户快照来判断，因为 selectedCustomer 可能还未更新
      const customer = balanceOperationCustomer || selectedCustomer;
      if (!customer) {
        // 自动关闭对话框
        setIsBalanceDialogOpen(false);
      }
    }
  }, [isBalanceDialogOpen]); // 只监听对话框打开状态，不监听 customer 变化

  const loadCustomers = () => {
    const params: { page: number; pageSize: number; search?: string } = { page, pageSize };
    if (searchTerm) params.search = searchTerm;
    fetchCustomers(params);
  };

  const handleSearch = () => {
    fetchCustomers({ page: 1, pageSize, search: searchTerm });
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer(formData);
      setIsAddDialogOpen(false);
      resetFormData();
      loadCustomers();
    } catch {
      // Error handled by store
    }
  };

  const resetFormData = () => {
    setFormData({
      petName: '',
      ownerName: '',
      phone: '',
      memberLevel: 0,
      avatar: '',
      petType: '',
      breed: '',
      age: undefined,
      gender: '',
      notes: '',
    });
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await updateCustomer(selectedCustomer.id, formData);
      setIsEditMode(false);
      setIsDetailDialogOpen(false);
      setSelectedCustomer(null);
      resetFormData();
      loadCustomers();
    } catch {
      // Error handled by store
    }
  };

  const startEdit = () => {
    if (!selectedCustomer) return;
    setFormData({
      petName: selectedCustomer.petName,
      ownerName: selectedCustomer.ownerName,
      phone: selectedCustomer.phone,
      memberLevel: selectedCustomer.memberLevel,
      avatar: selectedCustomer.avatar || '',
      petType: selectedCustomer.petType || '',
      breed: selectedCustomer.breed || '',
      age: selectedCustomer.age,
      gender: selectedCustomer.gender || '',
      notes: selectedCustomer.notes || '',
    });
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    resetFormData();
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    if (window.confirm(`确定要删除客户 "${selectedCustomer.petName}" 吗？此操作不可恢复。`)) {
      try {
        await deleteCustomer(selectedCustomer.id);
        setIsDetailDialogOpen(false);
        setIsEditMode(false);
        setSelectedCustomer(null);
        resetFormData();
        loadCustomers();
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailDialogOpen(true);
    setIsEditMode(false);
  };

  const viewConsumptionRecords = (customerId: number) => {
    // 先导航到消费记录页面，路由变化会自动卸载当前组件并重置状态
    navigate(`/customers/${customerId}/records`);
    // 关闭客户详情对话框
    setIsDetailDialogOpen(false);
  };

  // 新增消费记录成功后的回调
  const handleConsumptionRecordAdded = async () => {
    if (selectedCustomer) {
      try {
        const updatedCustomer = await customerApi.getCustomer(selectedCustomer.id);
        setSelectedCustomer(updatedCustomer.data.data);
        loadCustomers();
      } catch {
        // 静默处理
      }
    }
  };

  // 根据会员筛选器过滤客户列表
  const getFilteredCustomers = () => {
    if (memberFilter === 'all') return customers;
    if (memberFilter === 'member') return customers.filter(c => isMember(c.memberLevel));
    if (memberFilter === 'non-member') return customers.filter(c => !isMember(c.memberLevel));
    return customers;
  };

  const filteredCustomers = getFilteredCustomers();

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">客户信息</h1>
        <p className="text-gray-500 mt-1">管理宠物店客户和宠物信息</p>
      </div>

      {/* 搜索和操作栏 */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索姓名或电话..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value as 'all' | 'member' | 'non-member')}
              >
                <option value="all">全部客户</option>
                <option value="member">会员</option>
                <option value="non-member">非会员</option>
              </select>
              <Button onClick={handleSearch}>搜索</Button>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus size={20} className="mr-2" />
              新增客户
            </Button>
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

      {/* 客户卡片网格 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">暂无客户数据</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openCustomerDetail(customer)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* 宠物头像 */}
                  <div className="flex-shrink-0">
                    {customer.avatar ? (
                      <img
                        src={customer.avatar}
                        alt={customer.petName}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl text-gray-400">
                          {customer.petType === '猫' ? '🐱' : customer.petType === '狗' ? '🐕' : '🐾'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 客户信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {customer.petName}
                      </h3>
                      <span
                        className="inline-flex items-center rounded-full font-medium border text-sm px-4 py-2"
                        style={{
                          backgroundColor: getMemberLevelBgColor(customer.memberLevel),
                          color: getMemberLevelColor(customer.memberLevel),
                          borderColor: getMemberLevelBorderColor(customer.memberLevel),
                          borderWidth: '2px',
                        }}
                      >
                        {getMemberLevelLabel(customer.memberLevel)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">主人:</span> {customer.ownerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">电话:</span> {customer.phone}
                    </p>
                    {customer.breed && (
                      <p className="text-xs text-gray-500 mt-2">
                        {customer.petType} · {customer.breed}
                        {customer.age && ` · ${customer.age}岁`}
                        {customer.gender && ` · ${customer.gender}`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {total > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(newPage) => fetchCustomers({ page: newPage, pageSize, search: searchTerm })}
              onPageSizeChange={(newPageSize) => fetchCustomers({ page: 1, pageSize: newPageSize, search: searchTerm })}
              pageSizeOptions={[9, 18, 36, 72]}
              isLoading={isLoading}
            />
          </div>
        )}
      </>
      )}

      {/* 新增客户对话框 */}
      <Dialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetFormData();
          clearError();
        }}
        title="新增客户"
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto px-1">
          <form onSubmit={handleAddCustomer} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">宠物名称 *</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.petName}
                onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主人姓名 *</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">电话号码</label>
            <input
              type="tel"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="11位手机号（选填）"
              pattern="[0-9]{11]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">宠物类型</label>
              <select
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.petType}
                onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
              >
                <option value="">请选择</option>
                <option value="猫">猫</option>
                <option value="狗">狗</option>
                <option value="鸟">鸟</option>
                <option value="兔子">兔子</option>
                <option value="仓鼠">仓鼠</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品种</label>
              <input
                type="text"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                ref={createPreventWheelRef()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
              <select
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">请选择</option>
                <option value="公">公</option>
                <option value="母">母</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">宠物头像（选填）</label>
            <ImageUpload
              value={formData.avatar}
              onChange={(url) => setFormData({ ...formData, avatar: url })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">会员级别 *</label>
            <div className="flex flex-wrap gap-2">
              {MEMBER_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, memberLevel: level.value });
                    // 如果选择了非0的会员级别，提示设置初始余额
                    if (level.value > 0) {
                      alert('提示：请记得为客户设置初始余额！\n\n创建客户后，可在客户详情页点击"充值"按钮设置初始余额。');
                    }
                  }}
                  className={`
                    px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all
                    ${formData.memberLevel === level.value
                      ? 'border-current shadow-md scale-105'
                      : 'border-gray-300 opacity-70 hover:opacity-100'
                    }
                  `}
                  style={{
                    color: formData.memberLevel === level.value ? level.color : '#6b7280',
                    backgroundColor: formData.memberLevel === level.value ? level.bgColor : '#f9fafb',
                    borderColor: formData.memberLevel === level.value ? level.color : '#d1d5db',
                  }}
                >
                  {level.label}
                </button>
              ))}
            </div>
            {formData.memberLevel === 0 && (
              <p className="text-xs text-gray-500 mt-1">当前选择：非会员</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注信息</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="请输入备注信息"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetFormData();
                clearError();
              }}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '提交中...' : '确认添加'}
            </Button>
          </div>
        </form>
        </div>
      </Dialog>

      {/* 客户详情对话框 */}
      <Dialog
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setIsEditMode(false);
          setSelectedCustomer(null);
          resetFormData();
          // 关闭所有可能打开的内层对话框
          setIsBalanceDialogOpen(false);
          setIsBalanceHistoryOpen(false);
        }}
        title={isEditMode ? '编辑客户' : '客户详情'}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {!isEditMode ? (
              <>
                {/* 查看模式 */}
                {/* 基本信息 */}
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    {selectedCustomer.avatar ? (
                      <img
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.petName}
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-4xl text-gray-400">
                          {selectedCustomer.petType === '猫' ? '🐱' : selectedCustomer.petType === '狗' ? '🐕' : '🐾'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer.petName}</h3>
                      <span
                        className="inline-flex items-center rounded-full font-medium border text-xl px-8 py-4"
                        style={{
                          backgroundColor: getMemberLevelBgColor(selectedCustomer.memberLevel),
                          color: getMemberLevelColor(selectedCustomer.memberLevel),
                          borderColor: getMemberLevelBorderColor(selectedCustomer.memberLevel),
                          borderWidth: '3px',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {getMemberLevelLabel(selectedCustomer.memberLevel)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        <span className="font-medium">主人:</span> {selectedCustomer.ownerName}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">电话:</span> {selectedCustomer.phone}
                      </p>
                      {selectedCustomer.petType && (
                        <p className="text-gray-600">
                          <span className="font-medium">类型:</span> {selectedCustomer.petType}
                        </p>
                      )}
                      {selectedCustomer.breed && (
                        <p className="text-gray-600">
                          <span className="font-medium">品种:</span> {selectedCustomer.breed}
                        </p>
                      )}
                      {(selectedCustomer.age || selectedCustomer.gender) && (
                        <p className="text-gray-600">
                          <span className="font-medium">详情:</span>{' '}
                          {selectedCustomer.age && `${selectedCustomer.age}岁`}
                          {selectedCustomer.age && selectedCustomer.gender && ' · '}
                          {selectedCustomer.gender}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 备注信息 */}
                {selectedCustomer.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">备注信息</h4>
                    <p className="text-gray-600 text-sm">{selectedCustomer.notes}</p>
                  </div>
                )}

                {/* 余额信息 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="text-blue-600" size={24} />
                      <div>
                        <p className="text-xs text-gray-600">会员余额</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ¥{((selectedCustomer.balance || 0) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedCustomer) {
                            return;
                          }
                          // 保存客户快照，避免 selectedCustomer 被清空
                          setBalanceOperationCustomer(selectedCustomer);
                          setBalanceDialogType('recharge');
                          setBalanceAmount('');
                          setBalanceDescription('');
                          setIsBalanceDialogOpen(true);
                        }}
                      >
                        充值
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedCustomer) {
                            return;
                          }
                          // 保存客户快照，避免 selectedCustomer 被清空
                          setBalanceOperationCustomer(selectedCustomer);
                          setBalanceDialogType('deduct');
                          setBalanceAmount('');
                          setBalanceDescription('');
                          setIsBalanceDialogOpen(true);
                        }}
                      >
                        扣减
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const response = await customerApi.getBalanceHistory(selectedCustomer.id, { page: 1, pageSize: 9 });
                            setBalanceHistory(response.data.data.list);
                            setBalanceHistoryTotal(response.data.data.total);
                            setBalanceHistoryPage(1);
                            setIsBalanceHistoryOpen(true);
                          } catch {
                            // Error handled silently
                          }
                        }}
                      >
                        <History size={16} className="mr-1" />
                        历史
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="space-y-3 pt-4 border-t">
                  {/* 第一组：主要操作 */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button onClick={startEdit} className="w-full sm:w-auto">
                      <Edit size={18} className="mr-2" />
                      编辑
                    </Button>
                    <Button onClick={() => setIsConsumptionDialogOpen(true)} className="w-full sm:w-auto">
                      <Plus size={18} className="mr-2" />
                      新增消费记录
                    </Button>
                    <Button onClick={() => viewConsumptionRecords(selectedCustomer.id)} className="w-full sm:w-auto">
                      查看消费记录
                    </Button>
                  </div>

                  {/* 第二组：次要操作 */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        setIsEditMode(false);
                        setSelectedCustomer(null);
                        resetFormData();
                        // 关闭所有可能打开的内层对话框
                        setIsBalanceDialogOpen(false);
                        setIsBalanceHistoryOpen(false);
                        setIsConsumptionDialogOpen(false);
                      }}
                      className="w-full sm:w-auto"
                    >
                      关闭
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDeleteCustomer}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 size={18} className="mr-2" />
                      删除
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 编辑模式 */}
                <div className="max-h-[70vh] overflow-y-auto px-1">
                  <form onSubmit={handleEditCustomer} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">宠物名称 *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.petName}
                          onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">主人姓名 *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">电话号码</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="11位手机号（选填）"
                      pattern="[0-9]{11}"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">宠物类型</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.petType}
                        onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                      >
                        <option value="">请选择</option>
                        <option value="猫">猫</option>
                        <option value="狗">狗</option>
                        <option value="鸟">鸟</option>
                        <option value="兔子">兔子</option>
                        <option value="仓鼠">仓鼠</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">品种</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.age || ''}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                        ref={createPreventWheelRef()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">请选择</option>
                        <option value="公">公</option>
                        <option value="母">母</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">宠物头像（选填）</label>
                    <ImageUpload
                      value={formData.avatar}
                      onChange={(url) => setFormData({ ...formData, avatar: url })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">会员级别 *</label>
                    <div className="flex flex-wrap gap-2">
                      {MEMBER_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, memberLevel: level.value });
                            // 如果选择了非0的会员级别，提示设置初始余额
                            if (level.value > 0) {
                              alert('提示：请记得为客户设置初始余额！\n\n创建客户后，可在客户详情页点击"充值"按钮设置初始余额。');
                            }
                          }}
                          className={`
                            px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all
                            ${formData.memberLevel === level.value
                              ? 'border-current shadow-md scale-105'
                              : 'border-gray-300 opacity-70 hover:opacity-100'
                            }
                          `}
                          style={{
                            color: formData.memberLevel === level.value ? level.color : '#6b7280',
                            backgroundColor: formData.memberLevel === level.value ? level.bgColor : '#f9fafb',
                            borderColor: formData.memberLevel === level.value ? level.color : '#d1d5db',
                          }}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                    {formData.memberLevel === 0 && (
                      <p className="text-xs text-gray-500 mt-1">当前选择：非会员</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">备注信息</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="请输入备注信息"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelEdit}
                    >
                      <X size={18} className="mr-2" />
                      取消
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      <Check size={18} className="mr-2" />
                      {isLoading ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </form>
                </div>
              </>
            )}
          </div>
        )}
      </Dialog>

      {/* 余额操作对话框 */}
      <Dialog
        isOpen={isBalanceDialogOpen}
        onClose={() => {
          setIsBalanceDialogOpen(false);
          setBalanceAmount('');
          setBalanceDescription('');
          setBalanceOperationCustomer(null); // 清空客户快照
        }}
        title={balanceDialogType === 'recharge' ? '会员充值' : '余额扣减'}
        size="md"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();

          // 验证 1：检查客户信息（优先使用快照）
          const customer = balanceOperationCustomer || selectedCustomer;
          if (!customer) {
            return;
          }

          // 验证 2：检查金额
          const amount = parseFloat(balanceAmount);

          if (balanceAmount.trim() === '' || isNaN(amount) || amount <= 0) {
            return;
          }

          const amountInCents = Math.round(amount * 100);

          // 验证 3：检查余额充足性（仅扣减操作）
          if (balanceDialogType === 'deduct') {
            const currentBalance = customer.balance || 0;
            if (currentBalance < amountInCents) {
              return;
            }
          }

          // 开始提交
          setIsSubmitting(true);

          try {
            if (balanceDialogType === 'recharge') {
              await customerApi.rechargeBalance(customer.id, {
                amount: amountInCents,
                description: balanceDescription || undefined,
              });
            } else {
              await customerApi.deductBalance(customer.id, {
                amount: amountInCents,
                description: balanceDescription || undefined,
              });
            }

            // 刷新客户信息
            const updatedCustomer = await customerApi.getCustomer(customer.id);

            // 更新客户信息（如果详情对话框仍然打开）
            if (selectedCustomer && selectedCustomer.id === customer.id) {
              setSelectedCustomer(updatedCustomer.data.data);
            }

            // 刷新列表
            loadCustomers();

            // 关闭对话框
            setIsBalanceDialogOpen(false);
            setBalanceAmount('');
            setBalanceDescription('');
            setBalanceOperationCustomer(null); // 清空快照
          } catch (error: any) {
            // 错误已经被 store 处理，或者静默失败
          } finally {
            setIsSubmitting(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金额（元）*
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              ref={createPreventWheelRef()}
              required
            />
            {balanceAmount && parseFloat(balanceAmount) <= 0 && (
              <p className="mt-1 text-sm text-red-600">金额必须大于 0</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              说明
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={balanceDescription}
              onChange={(e) => setBalanceDescription(e.target.value)}
              placeholder={balanceDialogType === 'recharge' ? '充值说明（选填）' : '扣减说明（选填）'}
            />
          </div>

          {balanceDialogType === 'deduct' && (balanceOperationCustomer || selectedCustomer) && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                当前余额: <span className="font-semibold">¥{(((balanceOperationCustomer || selectedCustomer)!.balance || 0) / 100).toFixed(2)}</span>
              </p>
              {balanceAmount && (
                <p className="text-sm text-gray-600 mt-1">
                  扣减后余额: <span className="font-semibold">¥{((((balanceOperationCustomer || selectedCustomer)!.balance || 0) - Math.round(parseFloat(balanceAmount) * 100)) / 100).toFixed(2)}</span>
                </p>
              )}
              {balanceAmount && ((balanceOperationCustomer || selectedCustomer)!.balance || 0) < Math.round(parseFloat(balanceAmount) * 100) && (
                <p className="text-red-600 font-medium mt-1">⚠️ 余额不足</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsBalanceDialogOpen(false);
                setBalanceAmount('');
                setBalanceDescription('');
                setBalanceOperationCustomer(null); // 清空客户快照
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isSubmitting
                ? (balanceDialogType === 'recharge' ? '充值中...' : '扣减中...')
                : (balanceDialogType === 'recharge' ? '确认充值' : '确认扣减')
              }
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 余额历史对话框 */}
      <Dialog
        isOpen={isBalanceHistoryOpen}
        onClose={() => {
          setIsBalanceHistoryOpen(false);
          setBalanceHistory([]);
          setBalanceHistoryPage(1);
        }}
        title="余额变动历史"
      >
        <div className="space-y-4">
          {balanceHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无余额变动记录</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {balanceHistory.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-2xl font-bold ${
                          record.type === 'RECHARGE' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.type === 'RECHARGE' ? '+' : '-'}¥{(record.amount / 100).toFixed(2)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.type === 'RECHARGE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.type === 'RECHARGE' ? '充值' : '扣减'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>变动前: <span className="font-medium">¥{(record.balanceBefore / 100).toFixed(2)}</span></p>
                        <p>变动后: <span className="font-medium">¥{(record.balanceAfter / 100).toFixed(2)}</span></p>
                        {record.description && (
                          <p className="text-gray-500">说明: {record.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-500 mb-1">{new Date(record.createdAt).toLocaleString('zh-CN')}</p>
                      {record.operatorName && (
                        <p className="text-gray-600">
                          操作人: <span className="font-medium">{record.operatorName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {balanceHistoryTotal > 0 && (
            <div className="pt-4 border-t">
              <Pagination
                currentPage={balanceHistoryPage}
                pageSize={9}
                total={balanceHistoryTotal}
                onPageChange={async (newPage) => {
                  if (!selectedCustomer) return;
                  try {
                    const response = await customerApi.getBalanceHistory(selectedCustomer.id, {
                      page: newPage,
                      pageSize: 9,
                    });
                    setBalanceHistory(response.data.data.list);
                    setBalanceHistoryPage(newPage);
                  } catch (error) {
                    // Error handled silently
                  }
                }}
                isLoading={isLoading}
                hideOnSinglePage
              />
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => {
                setIsBalanceHistoryOpen(false);
                setBalanceHistory([]);
                setBalanceHistoryPage(1);
              }}
            >
              关闭
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 新增消费记录对话框 */}
      {selectedCustomer && (
        <ConsumptionRecordForm
          isOpen={isConsumptionDialogOpen}
          onClose={() => setIsConsumptionDialogOpen(false)}
          customerId={selectedCustomer.id}
          customer={selectedCustomer}
          onSuccess={handleConsumptionRecordAdded}
        />
      )}
    </div>
  );
};
