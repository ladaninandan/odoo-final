import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import RoleRoute from './routes/RoleRoute';
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
import StaffManagement from './components/admin/StaffManagement';
import CustomerList from './components/admin/CustomerList';
import AdminOrders from './components/admin/AdminOrders';

// Self-ordering
import SelfOrderMenu from './components/selforder/SelfOrderMenu';
import SelfOrderProductDetail from './components/selforder/SelfOrderProductDetail';
import SelfOrderStatus from './components/selforder/SelfOrderStatus';

/**
 * Role-based redirect: sends user to the correct home screen based on their role.
 */
const RoleRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  if (role === 'kitchen') return <Navigate to="/kitchen" replace />;
  if (role === 'cashier') return <Navigate to="/pos/floor" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  // Unknown role — force re-login
  return <Navigate to="/login" replace />;
};

/** Old bookmarked URLs: /pos/table/:id/customer → order screen */
function RedirectTableCustomerToOrder() {
  const { tableId } = useParams();
  return <Navigate to={`/pos/order/${tableId}`} replace />;
}

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
          <Route path=":token/status" element={<SelfOrderStatus />} />
          <Route path=":token/product/:productId" element={<SelfOrderProductDetail />} />
          <Route path=":token" element={<SelfOrderMenu />} />
        </Route>

        {/* ── Customer Display (public) ─────────────────── */}
        <Route path="/customer-display" element={<CustomerDisplay />} />

        {/* ── All Protected Routes ──────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<RoleRedirect />} />

          {/* POS — admin & cashier */}
          <Route element={<RoleRoute allowedRoles={['admin', 'cashier']} />}>
            <Route path="/pos" element={<POSLayout />}>
              <Route index element={<Navigate to="floor" replace />} />
              <Route path="floor" element={<FloorPlan />} />
              <Route path="table/:tableId/customer" element={<RedirectTableCustomerToOrder />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="order/:tableId" element={<OrderScreen />} />
              <Route path="payment/:orderId" element={<PaymentScreen />} />
            </Route>
          </Route>

          {/* Kitchen — admin & kitchen */}
          <Route element={<RoleRoute allowedRoles={['admin', 'kitchen']} />}>
            <Route path="/kitchen" element={<KitchenDisplay />} />
          </Route>

          {/* Admin back-office — admin only */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<ProductList />} />
              <Route path="categories" element={<CategoryList />} />
              <Route path="floors" element={<FloorTableManagement />} />
              <Route path="sessions" element={<SessionManager />} />
              <Route path="reports" element={<ReportsDashboard />} />
              <Route path="settings" element={<POSSettings />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="customers" element={<CustomerList />} />
            </Route>
          </Route>
        </Route>

        {/* ── 404 ──────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
