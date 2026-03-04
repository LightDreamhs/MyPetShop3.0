import React, { useState, useEffect, useRef } from 'react';
import { useConsumptionStore } from '../stores/consumptionStore';
import { useProductStore } from '../stores/productStore';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import { X } from 'lucide-react';
import type { ConsumptionRecordFormData, Customer, SaleItem } from '../types';
import { customerApi, transactionApi, saleApi } from '../services/api';
import { getCurrentLocalDateTime } from '../utils/dateFormat';
import { showErrorAlert, getErrorMessage } from '../utils/errorHandler';
import { createPreventWheelRef } from '../utils/inputHandlers';

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
  const { products, fetchProducts } = useProductStore();

  // 模式切换
  const [recordMode, setRecordMode] = useState<'service' | 'product'>('service');

  // 金额验证错误和输入框显示值
  const [amountError, setAmountError] = useState('');
  const [amountInputValue, setAmountInputValue] = useState('');

  // 余额支付状态和错误
  const [useBalance, setUseBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // 是否记账选项
  const [recordTransaction, setRecordTransaction] = useState(false);

  // 商品模式状态
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [manualTotalAmount, setManualTotalAmount] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // 购物车单价输入值（索引 -> 输入字符串）
  const [unitPriceInputValues, setUnitPriceInputValues] = useState<Record<number, string>>({});

  const [formData, setFormData] = useState<ConsumptionRecordFormData>({
    date: getCurrentLocalDateTime(),
    item: '',
    problem: '',
    suggestion: '',
    amount: undefined,
  });

  // 获取商品列表（仅商品模式需要）
  useEffect(() => {
    if (isOpen && recordMode === 'product') {
      fetchProducts({ page: 1, pageSize: 100 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, recordMode]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      date: getCurrentLocalDateTime(),
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
    setCartItems([]);
    setManualTotalAmount('');
    setShowProductDropdown(false);
    setProductSearchTerm('');
    setUnitPriceInputValues({});
    clearError();
  };

  // 对话框关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setRecordMode('service');
    }
  }, [isOpen]);

  // 点击外部关闭商品下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // 商品模式：添加商品到购物车
  const addProductToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 检查是否已经在购物车中
    const exists = cartItems.some(item => item.productId === productId);
    if (exists) {
      alert('该商品已在购物车中');
      return;
    }

    setCartItems([...cartItems, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: Math.round((product.price ?? 0) * 100),
      subtotal: 0
    }]);
    setShowProductDropdown(false);
    setProductSearchTerm('');
  };

  // 商品模式：更新购物车项目
  const updateCartItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const updatedItems = [...cartItems];
    if (field === 'quantity') {
      updatedItems[index].quantity = value;
      updatedItems[index].subtotal = updatedItems[index].unitPrice * value;
    } else {
      updatedItems[index].unitPrice = value;
      updatedItems[index].subtotal = value * updatedItems[index].quantity;
    }
    setCartItems(updatedItems);
  };

  // 商品模式：清空输入框（当用户按 backspace 清空时）
  const clearCartItemInput = (index: number, field: 'quantity' | 'unitPrice') => {
    const updatedItems = [...cartItems];
    if (field === 'quantity') {
      updatedItems[index].quantity = 0;
      updatedItems[index].subtotal = 0;
    } else {
      updatedItems[index].unitPrice = 0;
      updatedItems[index].subtotal = 0;
    }
    setCartItems(updatedItems);

    // 如果清空后总价为0，也清空手动输入
    if (updatedItems.every(item => item.quantity === 0)) {
      setManualTotalAmount('');
    }
  };

  // 商品模式：删除购物车项目
  const removeCartItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清除之前的错误
    setBalanceError('');
    clearError();

    try {
      if (recordMode === 'service') {
        // 服务模式：原有逻辑
        // 验证金额
        if (amountInputValue === '' || amountInputValue === '.') {
          setAmountError('请输入消费金额');
          return;
        } else if (formData.amount === undefined || formData.amount <= 0) {
          setAmountError('请输入有效的金额');
          return;
        }

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
          } catch (error: unknown) {
            console.error('创建记账记录失败:', error);
            const errorMessage = getErrorMessage(error, '未知错误');
            alert('消费记录已创建，但记账失败: ' + errorMessage);
            return;
          }
        }

        // 步骤3: 如果使用余额支付，扣减余额
        if (useBalance && formData.amount) {
          try {
            await customerApi.deductBalance(customerId, {
              amount: formData.amount,
              description: `消费: ${formData.item}`,
            });
          } catch (error: unknown) {
            console.error('余额扣减失败:', error);
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '未知错误';
            setBalanceError('消费记录已创建，但余额扣减失败: ' + errorMessage);
          }
        }
      } else {
        // 商品模式：新的逻辑
        if (cartItems.length === 0) {
          alert('请至少添加一件商品');
          return;
        }

        const totalAmountInCents = Math.round(parseFloat(manualTotalAmount) * 100);
        if (isNaN(totalAmountInCents) || totalAmountInCents <= 0) {
          setAmountError('请输入有效的消费金额');
          return;
        }

        // 创建销售记录（会自动创建消费记录）
        // 将 datetime-local 格式 (yyyy-MM-ddTHH:mm) 转换为 MySQL DATETIME 格式 (yyyy-MM-dd HH:mm:ss)
        const formatSaleDateForDB = (dateStr: string): string => {
          // dateStr 格式: "2026-02-12T00:13"
          const parts = dateStr.split('T');
          if (parts.length !== 2) {
            console.error('Invalid date format:', dateStr);
            return dateStr;
          }
          const [datePart, timePart] = parts;
          // timePart 格式: "00:13"，需要补全秒数
          return `${datePart} ${timePart}:00`;
        };

        await saleApi.createSale({
          customerId,
          customerName: customer?.ownerName || '',
          items: cartItems,
          totalAmount: totalAmountInCents,
          saleDate: formatSaleDateForDB(formData.date),
          recordToAccounting: recordTransaction,
          useBalance,
        });
      }

      // 成功，关闭对话框并回调
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('操作失败:', error);
      showErrorAlert(error, '操作失败，请重试');
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
          {/* 模式切换 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecordMode('service')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                recordMode === 'service'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              服务消费
            </button>
            <button
              type="button"
              onClick={() => setRecordMode('product')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                recordMode === 'product'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              商品消费
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费时间 *</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* 服务模式 */}
          {recordMode === 'service' && (
            <>
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
            </>
          )}

          {/* 商品模式 */}
          {recordMode === 'product' && (
            <>
              {/* 商品选择 */}
              <div className="relative" ref={productDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">添加商品</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="搜索或选择商品"
                    autoComplete="off"
                  />
                  {showProductDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {productSearchTerm === '' && (
                        <div className="px-3 py-2 text-sm text-gray-500 border-b">
                          请输入商品名称搜索，或从下方列表选择
                        </div>
                      )}
                      {products.filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(productSearchTerm.toLowerCase());
                        const inStock = p.stock > 0;
                        return matchesSearch && inStock;
                      }).map(product => (
                        <div
                          key={product.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addProductToCart(product.id);
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              库存: {product.stock} | 单价: ¥{((product.price ?? 0) / 100).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-green-600 text-lg">+</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 购物车列表 */}
              {cartItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">商品</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">数量</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">单价(元)</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">小计(元)</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cartItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{item.productName}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && e.currentTarget.value === '1') {
                                  e.preventDefault();
                                  clearCartItemInput(index, 'quantity');
                                }
                              }}
                              ref={createPreventWheelRef()}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={unitPriceInputValues[index] ?? (item.unitPrice === 0 ? '' : (item.unitPrice / 100).toFixed(2))}
                              onChange={(e) => {
                                const value = e.target.value;
                                // 允许输入数字和小数点
                                if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                                  setUnitPriceInputValues(prev => ({ ...prev, [index]: value }));
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue) && numValue > 0) {
                                  const priceInCents = Math.round(numValue * 100);
                                  updateCartItem(index, 'unitPrice', priceInCents);
                                  setUnitPriceInputValues(prev => ({ ...prev, [index]: numValue.toFixed(2) }));
                                } else if (value === '' || isNaN(numValue)) {
                                  updateCartItem(index, 'unitPrice', 0);
                                  setUnitPriceInputValues(prev => {
                                    const newValues = { ...prev };
                                    delete newValues[index];
                                    return newValues;
                                  });
                                }
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm">¥{(item.subtotal / 100).toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeCartItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 计算总价 */}
              {cartItems.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">计算总价：</span>
                    <span className="text-lg font-bold text-gray-900">
                      ¥{cartItems.reduce((sum, item) => sum + item.subtotal, 0) / 100}
                    </span>
                  </div>
                </div>
              )}

              {/* 手动输入总价 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">消费金额 (元) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    amountError ? 'border-red-500' : 'border-gray-300'
                  } [appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  value={manualTotalAmount}
                  onChange={(e) => {
                    setManualTotalAmount(e.target.value);
                    setAmountError('');
                  }}
                  ref={createPreventWheelRef()}
                  placeholder="手动输入实际交易总价"
                  required
                />
                {amountError && (
                  <p className="mt-1 text-sm text-red-600">{amountError}</p>
                )}
              </div>
            </>
          )}

          {/* 余额支付选项（仅服务模式显示） */}
          {recordMode === 'service' && customer && (
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

          {/* 余额支付选项（商品模式） */}
          {recordMode === 'product' && customer && (
            <div className={`border-2 rounded-lg p-4 transition-all ${
              useBalance
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="useBalanceProduct"
                  checked={useBalance}
                  onChange={(e) => {
                    setUseBalance(e.target.checked);
                    setBalanceError('');
                  }}
                  disabled={manualTotalAmount ? (customer.balance || 0) < Math.round(parseFloat(manualTotalAmount) * 100) : false}
                  className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="useBalanceProduct" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${useBalance ? 'text-blue-700' : 'text-gray-900'}`}>
                      💰 使用余额支付
                    </span>
                    {manualTotalAmount && (
                      <span className={`text-sm ${useBalance ? 'text-blue-700' : 'text-gray-600'}`}>
                        当前余额: <span className="font-bold">¥{((customer.balance || 0) / 100).toFixed(2)}</span>
                      </span>
                    )}
                  </div>

                  {manualTotalAmount && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={useBalance ? 'text-blue-700' : 'text-gray-600'}>
                          消费金额:
                        </span>
                        <span className={`font-semibold ${useBalance ? 'text-blue-700' : 'text-gray-900'}`}>
                          ¥{parseFloat(manualTotalAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={useBalance ? 'text-blue-700' : 'text-gray-600'}>
                          {useBalance ? '扣款后余额:' : '当前余额:'}
                        </span>
                        <span className={`font-bold ${useBalance ? 'text-blue-900' : 'text-gray-900'}`}>
                          ¥{((useBalance
                            ? ((customer.balance || 0) - Math.round(parseFloat(manualTotalAmount) * 100))
                            : (customer.balance || 0)
                          ) / 100).toFixed(2)}
                        </span>
                      </div>
                      {(customer.balance || 0) < Math.round(parseFloat(manualTotalAmount) * 100) && useBalance && (
                        <p className="text-red-600 font-medium mt-2">⚠️ 余额不足，无法使用余额支付</p>
                      )}
                    </div>
                  )}
                  {!manualTotalAmount && (
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
            <Button
              type="submit"
              disabled={isLoading || (recordMode === 'product' && cartItems.length === 0)}
            >
              {isLoading ? '提交中...' : '确认添加'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
