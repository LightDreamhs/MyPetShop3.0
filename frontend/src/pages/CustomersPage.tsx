import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../stores/customerStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Search, Plus, Edit, X, Check, Trash2 } from 'lucide-react';
import { MEMBER_LEVELS, getMemberStatusLabel, getMemberLevelLabel, getMemberLevelColor, getMemberLevelBgColor, getMemberLevelBorderColor, isMember } from '../utils/memberLevel';
import type { Customer, CustomerFormData } from '../types';

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

  const loadCustomers = () => {
    const params: any = { page, pageSize };
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
    } catch (error) {
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
    } catch (error) {
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
    navigate(`/customers/${customerId}/records`);
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
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">宠物名称 *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.petName}
                onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主人姓名 *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">电话号码 *</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="11位手机号"
              pattern="[0-9]{11}"
              required
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
            <div className="grid grid-cols-5 gap-2">
              {MEMBER_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, memberLevel: level.value })}
                  className={`
                    px-3 py-2 rounded-lg border-2 font-medium text-sm transition-all
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

          <div className="flex justify-end space-x-3 pt-4">
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
      </Dialog>

      {/* 客户详情对话框 */}
      <Dialog
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setIsEditMode(false);
          setSelectedCustomer(null);
          resetFormData();
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

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      setIsEditMode(false);
                      setSelectedCustomer(null);
                      resetFormData();
                    }}
                  >
                    关闭
                  </Button>
                  <Button onClick={startEdit}>
                    <Edit size={18} className="mr-2" />
                    编辑
                  </Button>
                  <Button onClick={() => viewConsumptionRecords(selectedCustomer.id)}>
                    查看消费记录
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeleteCustomer}
                  >
                    <Trash2 size={18} className="mr-2" />
                    删除
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* 编辑模式 */}
                <form onSubmit={handleEditCustomer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">宠物名称 *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.petName}
                        onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">主人姓名 *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">电话号码 *</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="11位手机号"
                      pattern="[0-9]{11}"
                      required
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
                    <div className="grid grid-cols-5 gap-2">
                      {MEMBER_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, memberLevel: level.value })}
                          className={`
                            px-3 py-2 rounded-lg border-2 font-medium text-sm transition-all
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
              </>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
