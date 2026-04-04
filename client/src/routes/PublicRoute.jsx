import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // If the user IS already logged in, they shouldn't be allowed to visit 
  // the Login or Register pages again. We securely bounce them back to the Dashboard.
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;
