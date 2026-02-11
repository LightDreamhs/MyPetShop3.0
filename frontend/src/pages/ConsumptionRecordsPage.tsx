import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Wallet } from 'lucide-react';
import { useCustomerStore } from '../stores/customerStore';
import { useConsumptionStore } from '../stores/consumptionStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { ConsumptionRecordForm } from '../components/ConsumptionRecordForm';
import { getMemberLevelLabel, getMemberLevelBgColor, getMemberLevelColor, getMemberLevelBorderColor } from '../utils/memberLevel';

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
    deleteRecord,
    clearError,
  } = useConsumptionStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 使用 useCallback 避免依赖项问题
  const loadRecords = useCallback(() => {
    if (customerId) {
      fetchRecords(parseInt(customerId), { page, pageSize });
    }
  }, [customerId, page, pageSize, fetchRecords]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer(parseInt(customerId));
      loadRecords();
    }
  }, [customerId, fetchCustomer, loadRecords]);

  // 新增消费记录成功后的回调
  const handleRecordAdded = () => {
    loadRecords();
    if (customerId) {
      fetchCustomer(parseInt(customerId));
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (window.confirm('确定要删除这条消费记录吗？')) {
      try {
        await deleteRecord(id);
        loadRecords();
      } catch {
        // Error handled by store
      }
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
                    <span
                      className="inline-flex items-center rounded-full font-medium border text-sm px-4 py-2"
                      style={{
                        backgroundColor: getMemberLevelBgColor(currentCustomer.memberLevel),
                        color: getMemberLevelColor(currentCustomer.memberLevel),
                        borderColor: getMemberLevelBorderColor(currentCustomer.memberLevel),
                        borderWidth: '2px',
                      }}
                    >
                      {getMemberLevelLabel(currentCustomer.memberLevel)}
                    </span>
                  </div>
                  {/* 余额显示 */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Wallet className="text-blue-600" size={20} />
                      <div>
                        <p className="text-xs text-gray-600">会员余额</p>
                        <p className="text-xl font-bold text-gray-900">
                          ¥{((currentCustomer.balance || 0) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-900"
                              title="删除记录"
                            >
                              <Trash2 size={16} />
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
                      if (customerId) {
                        fetchRecords(parseInt(customerId), { page: newPage, pageSize });
                      }
                    }}
                    onPageSizeChange={(newPageSize) => {
                      if (customerId) {
                        fetchRecords(parseInt(customerId), { page: 1, pageSize: newPageSize });
                      }
                    }}
                    pageSizeOptions={[10, 20, 50, 100]}
                    isLoading={isLoading}
                  />
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
      {currentCustomer && (
        <ConsumptionRecordForm
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          customerId={parseInt(customerId!)}
          customer={currentCustomer}
          onSuccess={handleRecordAdded}
        />
      )}
    </div>
  );
};
