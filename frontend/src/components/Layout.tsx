import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Users as UsersIcon, Coins, LogOut, UserRound, Edit, Menu, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/Button';
import { ProfileEditDialog } from './ProfileEditDialog';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  adminOnly?: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, getCurrentUser } = useAuthStore();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleProfileUpdateSuccess = async () => {
    try {
      await getCurrentUser();
    } catch {
      // Error handled by authStore
    }
  };

  const navItems: NavItem[] = [
    { id: 'inventory', label: '库存管理', icon: Package },
    { id: 'customers', label: '客户信息', icon: UsersIcon },
    { id: 'accounting', label: '财务记账', icon: Coins },
    { id: 'users', label: '店员账号', icon: UserRound, adminOnly: true },
  ];

  // 过滤导航菜单，只显示用户有权限访问的菜单项
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin());

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 桌面端侧边栏 - lg及以上显示 */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200">
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
          {visibleNavItems.map((item) => {
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
          <div
            className="flex items-center justify-between mb-3 p-2 -m-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
            onClick={() => setIsProfileEditOpen(true)}
            title="点击编辑个人资料"
          >
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
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 truncate">
                    {user?.username || ''}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user?.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.role === 'ADMIN' ? '管理员' : '普通员工'}
                  </span>
                </div>
              </div>
            </div>
            <Edit
              size={16}
              className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
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

      {/* 移动端抽屉导航 */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* 抽屉 */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">宠物店管理</h1>
                  <p className="text-xs text-gray-500">后台管理系统</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* 导航菜单 */}
            <nav className="flex-1 p-4 space-y-2 overflow-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-4 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="font-medium text-base">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 用户信息 */}
            <div className="p-4 border-t border-gray-200">
              <div
                className="flex items-center justify-between mb-3 p-2 -m-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => {
                  setIsProfileEditOpen(true);
                  setMobileMenuOpen(false);
                }}
                title="点击编辑个人资料"
              >
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 truncate">
                        {user?.username || ''}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user?.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user?.role === 'ADMIN' ? '管理员' : '普通员工'}
                      </span>
                    </div>
                  </div>
                </div>
                <Edit
                  size={16}
                  className="text-gray-400"
                />
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
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 移动端顶部栏 */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">宠物店管理</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
            aria-label="打开菜单"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
        </header>

        {/* 内容 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* 个人资料编辑对话框 */}
      {user && (
        <ProfileEditDialog
          isOpen={isProfileEditOpen}
          onClose={() => setIsProfileEditOpen(false)}
          user={user}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}
    </div>
  );
};
