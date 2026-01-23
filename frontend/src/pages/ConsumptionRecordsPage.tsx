import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCustomerStore } from '../stores/customerStore';
import { useConsumptionStore } from '../stores/consumptionStore';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { ConsumptionRecordFormData } from '../types';

export const ConsumptionRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const { currentCustomer, fetchCustomer, isLoading: customerLoading } = useCustomerStore();
  const {
    records,
    total,
    page,
    pageSize,
    isLoading,
    error,
    fetchRecords,
    createRecord,
    clearError,
  } = useConsumptionStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 金额验证错误和输入框显示值
  const [amountError, setAmountError] = useState('');
  const [amountInputValue, setAmountInputValue] = useState('');

  const [formData, setFormData] = useState<ConsumptionRecordFormData>({
    date: new Date().toISOString().split('T')[0],
    item: '',
    problem: '',
    suggestion: '',
    amount: undefined,
  });

  useEffect(() => {
    if (customerId) {
      fetchCustomer(parseInt(customerId));
      loadRecords();
    }
  }, [customerId, page]);

  const loadRecords = () => {
    if (customerId) {
      fetchRecords(parseInt(customerId), { page, pageSize });
    }
  };

  // 验证金额输入（宽松验证，允许输入过程中的中间状态）
  const validateAmountInput = (value: string): boolean => {
    // 允许空字符串
    if (value === '') {
      setAmountError('');
      return true;
    }

    // 允许单独的小数点（正在输入小数）
    if (value === '.') {
      setAmountError('');
      return true;
    }

    // 允许：纯数字、数字+小数点、数字+小数点+最多2位小数
    // 输入过程中的状态：如 "1", "10", "1.", "1.0", "1.00"
    const amountRegex = /^\d*\.?\d{0,2}$/;
    if (!amountRegex.test(value)) {
      setAmountError('请输入数字');
      return false;
    }

    // 如果是完整数字，检查是否为负数
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
      setFormData({ ...formData, amount: undefined });
      return;
    }

    const numValue = parseFloat(amountInputValue);
    if (!isNaN(numValue) && numValue > 0) {
      const amountInCents = Math.round(numValue * 100);
      setFormData({ ...formData, amount: amountInCents });
      setAmountInputValue(numValue.toFixed(2));
    } else {
      setAmountInputValue('');
      setFormData({ ...formData, amount: undefined });
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    // 验证金额（如果填写了）
    if (amountInputValue === '' || amountInputValue === '.') {
      // 金额是可选的，允许为空
      setAmountError('');
    } else if (formData.amount === undefined || formData.amount <= 0) {
      setAmountError('请输入有效的金额');
      return;
    }

    try {
      await createRecord(parseInt(customerId), formData);
      setIsAddDialogOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        item: '',
        problem: '',
        suggestion: '',
        amount: undefined,
      });
      setAmountError('');
      setAmountInputValue('');
      loadRecords();
    } catch (error) {
      // Error handled by store
    }
  };

  return (
    <div className="p-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        返回客户列表
      </button>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">消费记录</h1>
        <p className="text-gray-500 mt-1">查看客户的历史消费记录</p>
      </div>

      {customerLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      ) : currentCustomer ? (
        <>
          {/* 客户基本信息卡片 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {currentCustomer.avatar ? (
                    <img
                      src={currentCustomer.avatar}
                      alt={currentCustomer.petName}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-3xl text-gray-400">
                        {currentCustomer.petType === '猫' ? '🐱' : currentCustomer.petType === '狗' ? '🐕' : '🐾'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{currentCustomer.petName}</h2>
                    {currentCustomer.isMember ? (
                      <Badge variant="success">会员</Badge>
                    ) : (
                      <Badge variant="default">非会员</Badge>
                    )}
                  </div>
                  <p className="text-gray-600">
                    <span className="font-medium">主人:</span> {currentCustomer.ownerName}
                    <span className="mx-2">·</span>
                    <span className="font-medium">电话:</span> {currentCustomer.phone}
                  </p>
                  {currentCustomer.breed && (
                    <p className="text-sm text-gray-500 mt-1">
                      {currentCustomer.petType} · {currentCustomer.breed}
                      {currentCustomer.age && ` · ${currentCustomer.age}岁`}
                      {currentCustomer.gender && ` · ${currentCustomer.gender}`}
                    </p>
                  )}
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  新增记录
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

          {/* 消费记录表格 */}
          <Card>
            <CardHeader>
              <CardTitle>消费记录 ({total} 条)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-500">加载中...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无消费记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">消费项目</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发现问题</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">建议</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.item}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {record.problem || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {record.suggestion || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {record.amount ? `¥${(record.amount / 100).toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">客户信息不存在</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => navigate('/customers')}
            >
              返回客户列表
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 新增记录对话框 */}
      <Dialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setFormData({
            date: new Date().toISOString().split('T')[0],
            item: '',
            problem: '',
            suggestion: '',
            amount: undefined,
          });
          setAmountError('');
          setAmountInputValue('');
          clearError();
        }}
        title="新增消费记录"
        size="lg"
      >
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费日期 *</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费项目 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              placeholder="例如: 洗澡美容、疫苗接种"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">发现问题</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              placeholder="例如: 皮肤轻微红疹"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">建议</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={formData.suggestion}
              onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
              placeholder="例如: 建议使用低敏洗毛精，注意保持干燥"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费金额 (元)</label>
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
            />
            {amountError && (
              <p className="mt-1 text-sm text-red-600">{amountError}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddDialogOpen(false);
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  item: '',
                  problem: '',
                  suggestion: '',
                  amount: undefined,
                });
                setAmountError('');
                setAmountInputValue('');
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
    </div>
  );
};
