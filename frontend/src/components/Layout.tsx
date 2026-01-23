import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Users as UsersIcon, Coins, LogOut, UserRound } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/inventory')) return 'inventory';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/accounting')) return 'accounting';
    if (path.startsWith('/users')) return 'users';
    return 'inventory';
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'inventory':
        navigate('/');
        break;
      case 'customers':
        navigate('/customers');
        break;
      case 'accounting':
        navigate('/accounting');
        break;
      case 'users':
        navigate('/users');
        break;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'inventory', label: '库存管理', icon: Package },
    { id: 'customers', label: '客户信息', icon: UsersIcon },
    { id: 'accounting', label: '财务记账', icon: Coins },
    { id: 'users', label: '店员账号', icon: UserRound },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">宠物店管理</h1>
              <p className="text-xs text-gray-500">后台管理系统</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 用户信息 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {user?.nickname?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nickname || '用户'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.username || ''}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            退出登录
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
