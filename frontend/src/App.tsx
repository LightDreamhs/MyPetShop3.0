import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { ConsumptionRecordsPage } from './pages/ConsumptionRecordsPage';
import { AccountingPage } from './pages/AccountingPage';
import { UsersPage } from './pages/UsersPage';

// 私有路由组件
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, getCurrentUser } = useAuthStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      getCurrentUser();
    }
  }, [token, isAuthenticated, getCurrentUser]);

  if (!token) {
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
    </BrowserRouter>
  );
}

export default App;
