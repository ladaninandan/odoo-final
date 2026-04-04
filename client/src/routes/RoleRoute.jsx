import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const homeForRole = (role) => {
  if (role === 'kitchen') return '/kitchen';
  if (role === 'cashier') return '/pos/floor';
  if (role === 'admin') return '/admin';
  return '/login';
};

/**
 * Route guard: only `allowedRoles` may render child routes.
 * Others are sent to `redirectTo` or their role home (POS / kitchen / admin).
 */
const RoleRoute = ({ allowedRoles = [], redirectTo }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const target = redirectTo ?? homeForRole(user?.role);
    if (location.pathname === target || location.pathname.startsWith(`${target}/`)) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
