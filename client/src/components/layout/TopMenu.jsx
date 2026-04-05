import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutSuccess } from '../../store/slices/authSlice';
import authApi from '../../api/authApi';
import useAuth from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { LogOut, User, ChevronLeft } from 'lucide-react';

const TopMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAdmin } = useAuth();
  const { activeTable } = useSelector((state) => state.cart);

  const pageHint = useMemo(() => {
    if (location.pathname.startsWith('/pos/payment/')) return 'Payment';
    if (location.pathname.match(/^\/pos\/order\/([^/]+)/)) return 'Order';
    if (location.pathname.startsWith('/pos/customers')) return 'Customers';
    if (location.pathname.startsWith('/pos/floor')) return 'Floor plan';
    return '';
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    dispatch(logoutSuccess());
    navigate('/login');
  };

  const orderMatch = location.pathname.match(/^\/pos\/order\/([^/]+)/);
  const paymentMatch = location.pathname.includes('/pos/payment/');
  const showPosBack = Boolean(orderMatch || paymentMatch);
  const onFloor = location.pathname.startsWith('/pos/floor');

  const handlePosBack = () => {
    navigate('/pos/floor');
  };

  return (
    <header className="h-14 shrink-0 border-b border-slate-200/90 bg-white flex items-center justify-between gap-3 px-4 lg:px-8 shadow-sm">
      <div className="flex min-w-0 items-center gap-3 flex-1">
        {showPosBack && (
          <Button variant="ghost" size="icon" className="shrink-0 -ml-1" onClick={handlePosBack} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Odoo POS Cafe
          </h1>
          {pageHint && !onFloor && (
            <p className="text-xs text-slate-500 truncate">{pageHint}</p>
          )}
        </div>
      </div>

      {(onFloor || orderMatch) && activeTable && (
        <div className="hidden sm:flex flex-1 justify-center pointer-events-none">
          <span className="pointer-events-auto inline-flex items-center rounded-full border border-slate-200 bg-slate-100/90 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
            Table {activeTable.tableNumber}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-1 justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-10 rounded-full border-slate-200 bg-white px-3 font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              <User className="h-4 w-4 shrink-0 text-slate-600" />
              <span className="hidden sm:inline max-w-[8rem] truncate">
                {user?.first_name || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {user?.first_name} {user?.last_name}
              <p className="text-xs text-muted-foreground font-normal capitalize">{user?.role}</p>
            </DropdownMenuLabel>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/customers')}>Customers (admin)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/sessions')}>Sessions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>Settings</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/pos/customers')}>POS customers</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopMenu;
