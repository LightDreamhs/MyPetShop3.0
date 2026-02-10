import React, { useState, useEffect } from 'react';
import { useConsumptionStore } from '../stores/consumptionStore';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import type { ConsumptionRecordFormData, Customer } from '../types';
import { customerApi, transactionApi } from '../services/api';

interface ConsumptionRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  customer?: Customer;
  onSuccess?: () => void;
}

export const ConsumptionRecordForm: React.FC<ConsumptionRecordFormProps> = ({
  isOpen,
  onClose,
  customerId,
  customer,
  onSuccess,
}) => {
  const { createRecord, isLoading, error, clearError } = useConsumptionStore();

  // 金额验证错误和输入框显示值
  const [amountError, setAmountError] = useState('');
  const [amountInputValue, setAmountInputValue] = useState('');

  // 余额支付状态和错误
  const [useBalance, setUseBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // 是否记账选项
  const [recordTransaction, setRecordTransaction] = useState(false);

  const [formData, setFormData] = useState<ConsumptionRecordFormData>({
    date: new Date().toISOString().split('T')[0],
    item: '',
    problem: '',
    suggestion: '',
    amount: undefined,
  });

  // 重置表单
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      item: '',
      problem: '',
      suggestion: '',
      amount: undefined,
    });
    setAmountError('');
    setAmountInputValue('');
    setUseBalance(false);
    setBalanceError('');
    setRecordTransaction(false);
    clearError();
  };

  // 对话框关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清除之前的错误
    setBalanceError('');
    clearError();

    // 验证金额（如果填写了）
    if (amountInputValue === '' || amountInputValue === '.') {
      setAmountError('');
    } else if (formData.amount === undefined || formData.amount <= 0) {
      setAmountError('请输入有效的金额');
      return;
    }

    try {
      // 步骤1: 先创建消费记录
      await createRecord(customerId, formData);

      // 步骤2: 如果勾选了"是否记账"，创建记账记录
      if (recordTransaction && formData.amount && customer) {
        try {
          await transactionApi.createTransaction({
            type: 'income',
            amount: formData.amount,
            description: `${customer.petName}-${formData.item}-${(formData.amount / 100).toFixed(2)}元-${customer.phone}`,
            date: formData.date,
          });
        } catch (error) {
          console.error('创建记账记录失败:', error);
        }
      }

      // 步骤3: 如果使用余额支付，扣减余额
      if (useBalance && formData.amount) {
        try {
          await customerApi.deductBalance(customerId, {
            amount: formData.amount,
            description: `消费: ${formData.item}`,
          });
        } catch (error: any) {
          console.error('余额扣减失败:', error);
          setBalanceError('消费记录已创建，但余额扣减失败: ' + (error.response?.data?.message || '未知错误'));
        }
      }

      // 成功，关闭对话框并回调
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('创建消费记录失败:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="新增消费记录"
    >
      <div className="max-h-[70vh] overflow-y-auto px-1">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费日期 *</label>
            <input
              type="date"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费项目 *</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              rows={2}
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              placeholder="例如: 皮肤轻微红疹"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">建议</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
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
              className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

          {/* 余额支付选项 */}
          {customer && (
            <div className={`border-2 rounded-lg p-4 transition-all ${
              useBalance
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="useBalance"
                  checked={useBalance}
                  onChange={(e) => {
                    setUseBalance(e.target.checked);
                    setBalanceError('');
                  }}
                  disabled={formData.amount ? (customer.balance || 0) < formData.amount : false}
                  className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="useBalance" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${useBalance ? 'text-blue-700' : 'text-gray-900'}`}>
                      💰 使用余额支付
                    </span>
                    {formData.amount && (
                      <span className={`text-sm ${useBalance ? 'text-blue-700' : 'text-gray-600'}`}>
                        当前余额: <span className="font-bold">¥{((customer.balance || 0) / 100).toFixed(2)}</span>
                      </span>
                    )}
                  </div>

                  {formData.amount && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={useBalance ? 'text-blue-700' : 'text-gray-600'}>
                          消费金额:
                        </span>
                        <span className={`font-semibold ${useBalance ? 'text-blue-700' : 'text-gray-900'}`}>
                          ¥{(formData.amount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={useBalance ? 'text-blue-700' : 'text-gray-600'}>
                          {useBalance ? '扣款后余额:' : '当前余额:'}
                        </span>
                        <span className={`font-bold ${useBalance ? 'text-blue-900' : 'text-gray-900'}`}>
                          ¥{((useBalance
                            ? ((customer.balance || 0) - formData.amount)
                            : (customer.balance || 0)
                          ) / 100).toFixed(2)}
                        </span>
                      </div>
                      {(customer.balance || 0) < formData.amount && useBalance && (
                        <p className="text-red-600 font-medium mt-2">⚠️ 余额不足，无法使用余额支付</p>
                      )}
                    </div>
                  )}
                  {!formData.amount && (
                    <p className="text-gray-500 text-xs mt-1">请先填写消费金额</p>
                  )}
                </label>
              </div>
              {balanceError && (
                <p className="mt-2 text-sm text-red-600">{balanceError}</p>
              )}
            </div>
          )}

          {/* 是否记账选项 */}
          <div className={`border-2 rounded-lg p-4 ${
            recordTransaction
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="recordTransaction"
                checked={recordTransaction}
                onChange={(e) => setRecordTransaction(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="recordTransaction" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${recordTransaction ? 'text-green-700' : 'text-gray-900'}`}>
                    📝 记录到财务记账
                  </span>
                </div>
                <p className={`text-sm mt-1 ${recordTransaction ? 'text-green-700' : 'text-gray-600'}`}>
                  {recordTransaction
                    ? '✅ 此消费记录将同时添加到财务记账页面'
                    : 'ℹ️ 勾选后，此消费记录将同时添加到财务记账页面'}
                </p>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
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
  );
};
