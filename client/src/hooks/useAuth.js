import { useSelector } from 'react-redux';

/**
 * Hook providing auth state and role-check helpers.
 */
const useAuth = () => {
  const { user, isAuthenticated, accessToken } = useSelector((state) => state.auth);

  const isAdmin = user?.role === 'admin';
  const isCashier = user?.role === 'cashier';
  const isKitchen = user?.role === 'kitchen';

  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (...roles) => roles.includes(user?.role);

  return {
    user,
    isAuthenticated,
    accessToken,
    isAdmin,
    isCashier,
    isKitchen,
    hasRole,
    hasAnyRole,
  };
};

export default useAuth;
