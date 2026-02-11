import React, { useState, useEffect, useCallback } from 'react';
import { useProductStore } from '../stores/productStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Pagination } from '../components/ui/Pagination';
import { Plus, Search, Edit, Trash2, ShoppingCart, X } from 'lucide-react';
import type { Product, ProductFormData, SaleItem } from '../types';
import { saleApi } from '../services/api';
import { DEFAULT_PRODUCT_IMAGE } from '../constants';
import { showErrorAlert } from '../utils/errorHandler';
import { preventWheelChange } from '../utils/inputHandlers';

export const InventoryPage: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const {
    products,
    total,
    page,
    pageSize,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    clearError,
  } = useProductStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState(0);

  // 散客销售相关状态
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [saleDate, setSaleDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    // datetime-local 格式: yyyy-MM-ddTHH:mm
    return now.toISOString().slice(0, 16);
  });
  const [manualTotalAmount, setManualTotalAmount] = useState('');
  const [recordToAccounting, setRecordToAccounting] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  // 购物车单价输入值（索引 -> 输入字符串）
  const [unitPriceInputValues, setUnitPriceInputValues] = useState<Record<number, string>>({});

  // 价格验证错误和输入框显示值
  const [priceError, setPriceError] = useState('');
  const [priceInputValue, setPriceInputValue] = useState('');

  // 库存数量输入框显示值
  const [stockInputValue, setStockInputValue] = useState('');

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    description: '',
  });

  // 初始加载
  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 10, search: searchTerm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 打开销售对话框时获取商品列表（限制数量避免性能问题）
  useEffect(() => {
    if (isSaleDialogOpen) {
      fetchProducts({ page: 1, pageSize: 100 });
    }
  }, [isSaleDialogOpen, fetchProducts]);

  const handleSearch = useCallback(() => {
    fetchProducts({ page: 1, pageSize: 10, search: searchTerm });
  }, [searchTerm, fetchProducts]);

  // 验证价格输入（宽松验证，允许输入过程中的中间状态）
  const validatePriceInput = (value: string): boolean => {
    // 允许空字符串
    if (value === '') {
      setPriceError('');
      return true;
    }

    // 允许单独的小数点（正在输入小数）
    if (value === '.') {
      setPriceError('');
      return true;
    }

    // 允许：纯数字、数字+小数点、数字+小数点+最多2位小数
    // 输入过程中的状态：如 "1", "10", "1.", "1.0", "1.00"
    const priceRegex = /^\d*\.?\d{0,2}$/;
    if (!priceRegex.test(value)) {
      setPriceError('请输入数字');
      return false;
    }

    // 如果是完整数字，检查是否为负数
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue < 0) {
      setPriceError('价格不能为负数');
      return false;
    }

    setPriceError('');
    return true;
  };

  // 价格输入框变化处理
  const handlePriceInputChange = (value: string) => {
    setPriceInputValue(value);
    validatePriceInput(value);
  };

  // 价格输入框失去焦点时，转换为实际数值
  const handlePriceInputBlur = () => {
    if (priceInputValue === '' || priceInputValue === '.') {
      setPriceInputValue('');
      setFormData({ ...formData, price: 0 });
      return;
    }

    const numValue = parseFloat(priceInputValue);
    // 允许 0 值（赠品/样品场景）
    if (!isNaN(numValue) && numValue >= 0) {
      const priceInCents = Math.round(numValue * 100);
      setFormData({ ...formData, price: priceInCents });
      setPriceInputValue(numValue.toFixed(2));
    } else {
      setPriceInputValue('');
      setFormData({ ...formData, price: 0 });
    }
  };

  // 库存输入框失去焦点时，转换为实际数值
  const handleStockInputBlur = () => {
    if (stockInputValue === '') {
      setStockInputValue('');
      setFormData({ ...formData, stock: 0 });
      return;
    }

    const numValue = parseInt(stockInputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData({ ...formData, stock: numValue });
      setStockInputValue(numValue.toString());
    } else {
      setStockInputValue('');
      setFormData({ ...formData, stock: 0 });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 如果没有提供图片URL，使用默认图片
      const productData = {
        ...formData,
        imageUrl: formData.imageUrl.trim() || DEFAULT_PRODUCT_IMAGE
      };
      await createProduct(productData);
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        price: 0,
        stock: 0,
        imageUrl: '',
        description: '',
      });
      setPriceError('');
      setPriceInputValue('');
      setStockInputValue('');
      fetchProducts({ page, pageSize, search: searchTerm });
    } catch (error) {
      // Error handled by store
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      // 如果没有提供图片URL，使用默认图片
      const productData = {
        ...formData,
        imageUrl: formData.imageUrl.trim() || DEFAULT_PRODUCT_IMAGE
      };
      await updateProduct(selectedProduct.id, productData);
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      setFormData({
        name: '',
        price: 0,
        stock: 0,
        imageUrl: '',
        description: '',
      });
      setPriceError('');
      setPriceInputValue('');
      setStockInputValue('');
      fetchProducts({ page, pageSize, search: searchTerm });
    } catch (error) {
      // Error handled by store
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await updateStock(selectedProduct.id, stockValue);
      setIsStockDialogOpen(false);
      setSelectedProduct(null);
      setStockValue(0);
      fetchProducts({ page, pageSize, search: searchTerm });
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('确定要删除这个商品吗？')) {
      try {
        await deleteProduct(id);
        fetchProducts({ page, pageSize, search: searchTerm });
      } catch (error: any) {
        // 检测是否是外键约束错误（商品有关联的消费记录/销售记录）
        const errorMessage = error.response?.data?.message || '';
        const isForeignKeyError =
          errorMessage.includes('foreign key constraint') ||
          errorMessage.includes('Cannot delete') ||
          errorMessage.includes('foreign key') ||
          errorMessage.includes('constraint') ||
          error.response?.status === 500;

        if (isForeignKeyError) {
          alert('无法删除该商品！\n\n该商品存在关联的消费记录或销售记录。\n请先删除相关的消费记录和销售记录后再试。');
        } else {
          showErrorAlert(error, '删除商品失败');
        }
      }
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price ?? 0,
      stock: product.stock,
      imageUrl: product.imageUrl,
      description: product.description || '',
    });
    // 设置价格输入框的显示值
    setPriceInputValue(((product.price ?? 0) / 100).toFixed(2));
    // 设置库存输入框的显示值
    setStockInputValue(product.stock.toString());
    setIsEditDialogOpen(true);
  };

  const openStockDialog = (product: Product) => {
    setSelectedProduct(product);
    setStockValue(product.stock);
    setIsStockDialogOpen(true);
  };

  // 快速调整库存
  const handleQuickStockChange = async (productId: number, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    if (newStock === currentStock) return;

    try {
      await updateStock(productId, newStock);
      fetchProducts({ page, pageSize, search: searchTerm });
    } catch (error) {
      // Error handled by store
    }
  };

  // 散客销售：添加商品到购物车
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
      unitPrice: Math.round((product.price ?? 0) * 100), // 自动填充进价
      subtotal: 0
    }]);
    setShowProductDropdown(false);
    setProductSearchTerm('');
  };

  // 散客销售：更新购物车项目
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

    // 自动计算总价
    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    setManualTotalAmount((newTotal / 100).toFixed(2));
  };

  // 散客销售：删除购物车项目
  const removeCartItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // 散客销售：提交订单
  const handleWalkInSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('请至少添加一件商品');
      return;
    }

    const totalAmountInCents = Math.round(parseFloat(manualTotalAmount) * 100);
    if (isNaN(totalAmountInCents) || totalAmountInCents <= 0) {
      alert('请输入有效的销售总价');
      return;
    }

    try {
      // 将 datetime-local 格式 (yyyy-MM-ddTHH:mm) 转换为 MySQL DATETIME 格式 (yyyy-MM-dd HH:mm:ss)
      const formatSaleDateForDB = (dateStr: string): string => {
        // dateStr 格式: "2026-02-11T23:56"
        const parts = dateStr.split('T');
        if (parts.length !== 2) {
          console.error('Invalid date format:', dateStr);
          return dateStr;
        }
        const [datePart, timePart] = parts;
        // timePart 格式: "23:56"
        const result = `${datePart} ${timePart}:00`;
        console.log('Date conversion:', dateStr, '->', result);
        return result;
      };

      await saleApi.createSale({
        customerName,
        items: cartItems,
        totalAmount: totalAmountInCents,
        saleDate: formatSaleDateForDB(saleDate),
        recordToAccounting,
      });

      setIsSaleDialogOpen(false);
      setCartItems([]);
      setCustomerName('');
      setManualTotalAmount('');
      setRecordToAccounting(false);
      setUnitPriceInputValues({});

      // 重置日期为当前时间
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setSaleDate(now.toISOString().slice(0, 16));

      // 刷新商品列表
      fetchProducts({ page, pageSize, search: searchTerm });
      alert('开单成功！');
    } catch (error: unknown) {
      showErrorAlert(error, '开单失败，请重试');
    }
  };

  // 散客销售：关闭对话框时重置状态
  const closeSaleDialog = () => {
    setIsSaleDialogOpen(false);
    setCartItems([]);
    setCustomerName('');
    setManualTotalAmount('');
    setRecordToAccounting(false);
    setShowProductDropdown(false);
    setProductSearchTerm('');
    setUnitPriceInputValues({});
    // 重置日期为当前时间
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setSaleDate(now.toISOString().slice(0, 16));
  };

  // 点击外部关闭商品下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.getElementById('product-dropdown');
      if (dropdown && !dropdown.contains(target)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">库存管理</h1>
        <p className="text-gray-500 mt-1">管理宠物店商品库存信息</p>
      </div>

      {/* 搜索和操作栏 */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索商品名称..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>搜索</Button>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setIsSaleDialogOpen(true)}>
                <ShoppingCart size={20} className="mr-2" />
                开一单
              </Button>
              {isAdmin() && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus size={20} className="mr-2" />
                  新增商品
                </Button>
              )}
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

      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <CardTitle>商品列表 ({total} 件)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无商品数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                    {isAdmin() && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进价</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库存</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.imageUrl || 'https://via.placeholder.com/48'}
                              alt={product.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      {isAdmin() && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.price !== null ? `¥${(product.price / 100).toFixed(2)}` : '-'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* 减号按钮 */}
                          <button
                            onClick={() => handleQuickStockChange(product.id, product.stock, -1)}
                            disabled={product.stock <= 0}
                            className={`
                              w-8 h-8 rounded-full border-2 flex items-center justify-center
                              font-bold text-base transition-all duration-200
                              ${product.stock <= 0
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                : 'border-gray-300 text-gray-600 bg-white hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                              }
                            `}
                          >
                            -
                          </button>

                          {/* 库存数字 */}
                          <span className="text-base font-bold text-gray-900 min-w-[3rem] text-center">
                            {product.stock}
                          </span>

                          {/* 加号按钮 */}
                          <button
                            onClick={() => handleQuickStockChange(product.id, product.stock, 1)}
                            className="
                              w-8 h-8 rounded-full border-2 flex items-center justify-center
                              font-bold text-base transition-all duration-200
                              border-gray-300 text-gray-600 bg-white
                              hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50
                            "
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {product.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openStockDialog(product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          修改库存
                        </button>
                        {isAdmin() && (
                          <>
                            <button
                              onClick={() => openEditDialog(product)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
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
                onPageChange={(newPage) => fetchProducts({ page: newPage, pageSize, search: searchTerm })}
                onPageSizeChange={(newPageSize) => fetchProducts({ page: 1, pageSize: newPageSize, search: searchTerm })}
                pageSizeOptions={[10, 20, 50, 100]}
                isLoading={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增商品对话框 */}
      <Dialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setFormData({
            name: '',
            price: 0,
            stock: 0,
            imageUrl: '',
            description: '',
          });
          setPriceError('');
          setPriceInputValue('');
          setStockInputValue('');
          clearError();
        }}
        title="新增商品"
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input
            label="商品名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入商品名称"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="进价 (元)"
                type="text"
                inputMode="decimal"
                value={priceInputValue}
                onChange={(e) => handlePriceInputChange(e.target.value)}
                onBlur={handlePriceInputBlur}
                placeholder="0.00"
                error={priceError}
                className="[appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
            <Input
              label="库存数量"
              type="text"
              inputMode="numeric"
              value={stockInputValue}
              onChange={(e) => setStockInputValue(e.target.value)}
              onBlur={handleStockInputBlur}
              placeholder="请输入库存数量"
              className="[appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品图片（选填）</label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品描述</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入商品描述"
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
                  name: '',
                  price: 0,
                  stock: 0,
                  imageUrl: '',
                  description: '',
                });
                setPriceError('');
                setPriceInputValue('');
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

      {/* 编辑商品对话框 */}
      <Dialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedProduct(null);
          setFormData({
            name: '',
            price: 0,
            stock: 0,
            imageUrl: '',
            description: '',
          });
          setPriceError('');
          setPriceInputValue('');
          setStockInputValue('');
          clearError();
        }}
        title="编辑商品"
      >
        <form onSubmit={handleEditProduct} className="space-y-4">
          <Input
            label="商品名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入商品名称"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="进价 (元)"
                type="text"
                inputMode="decimal"
                value={priceInputValue}
                onChange={(e) => handlePriceInputChange(e.target.value)}
                onBlur={handlePriceInputBlur}
                placeholder="0.00"
                error={priceError}
                className="[appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
            <Input
              label="库存数量"
              type="text"
              inputMode="numeric"
              value={stockInputValue}
              onChange={(e) => setStockInputValue(e.target.value)}
              onBlur={handleStockInputBlur}
              placeholder="请输入库存数量"
              className="[appearance:none] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品图片（选填）</label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品描述</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入商品描述"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
                setFormData({
                  name: '',
                  price: 0,
                  stock: 0,
                  imageUrl: '',
                  description: '',
                });
                setPriceError('');
                setPriceInputValue('');
                clearError();
              }}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '更新中...' : '确认更新'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 修改库存对话框 */}
      <Dialog
        isOpen={isStockDialogOpen}
        onClose={() => {
          setIsStockDialogOpen(false);
          setSelectedProduct(null);
          setStockValue(0);
          clearError();
        }}
        title="修改库存"
        size="sm"
      >
        <form onSubmit={handleUpdateStock} className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">商品: {selectedProduct?.name}</p>
            <p className="text-sm text-gray-600">当前库存: {selectedProduct?.stock} 件</p>
          </div>
          <Input
            label="新库存数量"
            type="number"
            min="0"
            value={stockValue}
            onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsStockDialogOpen(false);
                clearError();
              }}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '更新中...' : '确认修改'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 开一单对话框 */}
      <Dialog
        isOpen={isSaleDialogOpen}
        onClose={closeSaleDialog}
        title="开一单 - 散客销售"
      >
        <form onSubmit={handleWalkInSale} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* 消费者姓名 */}
          <Input
            label="消费者姓名"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="请输入消费者姓名"
            required
          />

          {/* 商品选择 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">添加商品</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="搜索或选择商品"
                autoComplete="off"
              />
              {showProductDropdown && (
                <div id="product-dropdown" className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                      onClick={() => addProductToCart(product.id)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          库存: {product.stock} | 单价: ¥{((product.price ?? 0) / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-green-600 text-sm">+</div>
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
                          min="0"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => updateCartItem(index, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && e.currentTarget.value === (item.quantity === 0 ? '' : item.quantity.toString())) {
                              e.preventDefault();
                              e.currentTarget.value = '';
                              updateCartItem(index, 'quantity', 0);
                            }
                          }}
                          onWheel={preventWheelChange}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="数量"
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
          <Input
            label="销售总价（元）*"
            type="number"
            step="0.01"
            min="0"
            value={manualTotalAmount}
            onChange={(e) => setManualTotalAmount(e.target.value)}
            placeholder="手动输入实际交易总价"
            required
          />

          {/* 销售时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">销售时间</label>
            <input
              type="datetime-local"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 是否记账 */}
          <div className={`border-2 rounded-lg p-4 ${
            recordToAccounting
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="recordToAccountingWalkIn"
                checked={recordToAccounting}
                onChange={(e) => setRecordToAccounting(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="recordToAccountingWalkIn" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${recordToAccounting ? 'text-green-700' : 'text-gray-900'}`}>
                    📝 记录到财务记账
                  </span>
                </div>
                <p className={`text-sm mt-1 ${recordToAccounting ? 'text-green-700' : 'text-gray-600'}`}>
                  {recordToAccounting
                    ? '✅ 此销售记录将同时添加到财务记账页面'
                    : 'ℹ️ 勾选后，此销售记录将同时添加到财务记账页面'}
                </p>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeSaleDialog}>
              取消
            </Button>
            <Button type="submit" disabled={cartItems.length === 0}>
              确认开单
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
