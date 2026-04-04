import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import NotFound from './pages/NotFound';

// Layouts
import POSLayout from './components/layout/POSLayout';
import AdminLayout from './components/layout/AdminLayout';
import SelfOrderLayout from './components/selforder/SelfOrderLayout';

// POS screens
import FloorPlan from './components/pos/FloorPlan';
import OrderScreen from './components/pos/OrderScreen';
import PaymentScreen from './components/pos/PaymentScreen';

// Kitchen
import KitchenDisplay from './components/kitchen/KitchenDisplay';

// Customer Display
import CustomerDisplay from './components/customer/CustomerDisplay';

// Admin screens
import AdminDashboard from './components/admin/AdminDashboard';
import ProductList from './components/admin/ProductList';
import CategoryList from './components/admin/CategoryList';
import FloorTableManagement from './components/admin/FloorTableManagement';
import SessionManager from './components/admin/SessionManager';
import ReportsDashboard from './components/admin/ReportsDashboard';
import POSSettings from './components/admin/POSSettings';

// Self-ordering
import SelfOrderMenu from './components/selforder/SelfOrderMenu';
import SelfOrderStatus from './components/selforder/SelfOrderStatus';

/**
 * Role-based redirect: sends user to the correct home screen based on their role.
 */
const RoleRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  if (role === 'kitchen') return <Navigate to="/kitchen" replace />;
  if (role === 'admin' || role === 'cashier') return <Navigate to="/pos/floor" replace />;
  // Unknown role — force re-login
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public Auth Routes ────────────────────────── */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* ── Self-Order (token-based, no auth) ─────────── */}
        <Route path="/order" element={<SelfOrderLayout />}>
          <Route path=":token" element={<SelfOrderMenu />} />
          <Route path=":token/status" element={<SelfOrderStatus />} />
        </Route>

        {/* ── Customer Display (public) ─────────────────── */}
        <Route path="/customer-display" element={<CustomerDisplay />} />

        {/* ── All Protected Routes ──────────────────────── */}
        <Route element={<ProtectedRoute />}>
          {/* POS Terminal — admin & cashier */}
          <Route path="/pos" element={<POSLayout />}>
            <Route index element={<Navigate to="floor" replace />} />
            <Route path="floor" element={<FloorPlan />} />
            <Route path="order/:tableId" element={<OrderScreen />} />
            <Route path="payment/:orderId" element={<PaymentScreen />} />
          </Route>

          {/* Kitchen Display — admin & kitchen staff */}
          <Route path="/kitchen" element={<KitchenDisplay />} />

          {/* Admin Panel — admin only */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="floors" element={<FloorTableManagement />} />
            <Route path="sessions" element={<SessionManager />} />
            <Route path="reports" element={<ReportsDashboard />} />
            <Route path="settings" element={<POSSettings />} />
          </Route>

          {/* Default: redirect based on role */}
          <Route path="/" element={<RoleRedirect />} />
        </Route>

        {/* ── 404 ──────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
