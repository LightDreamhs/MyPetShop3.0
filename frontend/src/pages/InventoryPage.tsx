import React, { useState, useEffect } from 'react';
import { useProductStore } from '../stores/productStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Pagination } from '../components/ui/Pagination';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import type { Product, ProductFormData } from '../types';

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

  // 价格验证错误和输入框显示值
  const [priceError, setPriceError] = useState('');
  const [priceInputValue, setPriceInputValue] = useState('');

  // 库存数量输入框显示值
  const [stockInputValue, setStockInputValue] = useState('');

  // 默认商品图片
  const DEFAULT_PRODUCT_IMAGE = 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    description: '',
  });

  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 10, search: searchTerm });
  }, []);

  const handleSearch = () => {
    fetchProducts({ page: 1, pageSize: 10, search: searchTerm });
  };

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
    if (!isNaN(numValue) && numValue > 0) {
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

    // 验证价格
    if (formData.price <= 0) {
      setPriceError('请输入有效的价格');
      return;
    }

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

    // 验证价格
    if (formData.price <= 0) {
      setPriceError('请输入有效的价格');
      return;
    }

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
      } catch (error) {
        // Error handled by store
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
            {isAdmin() && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus size={20} className="mr-2" />
                新增商品
              </Button>
            )}
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
    </div>
  );
};
