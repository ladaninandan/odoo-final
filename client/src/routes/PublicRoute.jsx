import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const role = user?.role;
  
  if (!isAuthenticated) return <Outlet />;

  if (role === 'kitchen') return <Navigate to="/kitchen" replace />;
  if (role === 'cashier') return <Navigate to="/pos/floor" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  
  // Unknown role — let them through (login) so they can re-authenticate
  return <Outlet />;
};

export default PublicRoute;
