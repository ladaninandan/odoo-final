import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Route guard that restricts access based on user role.
 * Prevents infinite redirect loops by checking if we'd redirect
 * to a path that would redirect back.
 */
const RoleRoute = ({ allowedRoles = [], redirectTo = '/' }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Prevent infinite loops: if the redirectTo is where we already are, go to a safe default
    if (location.pathname === redirectTo || location.pathname.startsWith(redirectTo)) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
