import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';

// 路由懒加载 - 性能优化
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const ConsumptionRecordsPage = lazy(() => import('./pages/ConsumptionRecordsPage').then(m => ({ default: m.ConsumptionRecordsPage })));
const AccountingPage = lazy(() => import('./pages/AccountingPage').then(m => ({ default: m.AccountingPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));

// 加载中组件
const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  );
};

// 私有路由组件
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, getCurrentUser, isLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = React.useState(true);

  useEffect(() => {
    // 如果有 token，始终验证其有效性（不管 isAuthenticated 状态）
    if (token) {
      getCurrentUser()
        .finally(() => {
          setIsVerifying(false);
        });
    } else {
      setIsVerifying(false);
    }
  }, [token]); // 只依赖 token

  // 正在验证用户信息时显示加载状态
  if (isVerifying || isLoading) {
    return <LoadingFallback />;
  }

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 公共路由组件（已登录用户重定向到首页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 登录页面 - 公共路由 */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* 主应用路由 - 私有路由 */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <InventoryPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomersPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/customers/:customerId/records"
            element={
              <PrivateRoute>
                <Layout>
                  <ConsumptionRecordsPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/accounting"
            element={
              <PrivateRoute>
                <Layout>
                  <AccountingPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* 404 页面 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
