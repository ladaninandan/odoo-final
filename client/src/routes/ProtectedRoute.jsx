import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useSocket from '../hooks/useSocket';

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  useSocket();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
