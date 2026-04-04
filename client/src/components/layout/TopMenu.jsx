import React from 'react';
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
import {
  LayoutGrid, RefreshCw, Settings, LogOut, User, ChevronLeft,
} from 'lucide-react';
import PosStopSessionButton from '../pos/PosStopSessionButton';

const TopMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAdmin } = useAuth();
  const { activeTable, activeOrder, items: cartItems } = useSelector((state) => state.cart);
  const { current: session } = useSelector((state) => state.session);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    dispatch(logoutSuccess());
    navigate('/login');
  };

  const orderMatch = location.pathname.match(/^\/pos\/order\/([^/]+)/);
  const paymentMatch = location.pathname.includes('/pos/payment/');
  const customerMatch = location.pathname.match(/^\/pos\/table\/([^/]+)\/customer/);

  const handlePosBack = () => {
    if (customerMatch) navigate('/pos/floor');
    else if (orderMatch) {
      const tableId = orderMatch[1];
      const tableMatches = activeTable && String(activeTable._id) === String(tableId);
      const orderMatchesTable =
        tableMatches &&
        activeOrder &&
        String(activeTable.currentOrder?._id ?? activeTable.currentOrder ?? '') === String(activeOrder);
      const fromOccupiedTable =
        location.state?.fromOccupiedTable === true ||
        (tableMatches && cartItems.some((i) => i.locked)) ||
        (tableMatches && activeTable.status === 'occupied' && orderMatchesTable);
      if (fromOccupiedTable) navigate('/pos/floor');
      else navigate(`/pos/table/${tableId}/customer`);
    } else if (paymentMatch) navigate('/pos/floor');
    else navigate('/pos/floor');
  };

  const showPosBack = Boolean(customerMatch || orderMatch || paymentMatch);

  return (
    <header className="h-14 bg-card border-b flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {showPosBack && (
          <Button variant="ghost" size="icon" onClick={handlePosBack} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1
          className="text-lg font-bold text-primary cursor-pointer"
          onClick={() => navigate('/pos/floor')}
        >
          Odoo POS Cafe
        </h1>
        {activeTable && (
          <Badge variant="outline" className="text-sm">
            Table {activeTable.tableNumber}
          </Badge>
        )}
        {session && (
          <>
            <Badge variant="success" className="text-xs">
              Session Active
            </Badge>
            <PosStopSessionButton variant="destructive" size="sm" />
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pos/floor')} title="Floor View">
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => window.location.reload()} title="Reload">
          <RefreshCw className="h-4 w-4" />
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} title="Admin panel">
            <Settings className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              {user?.first_name || 'User'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.first_name} {user?.last_name}
              <p className="text-xs text-muted-foreground font-normal capitalize">{user?.role}</p>
            </DropdownMenuLabel>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/customers')}>Customers</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/sessions')}>Sessions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>Settings</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/pos/customers')}>Customers</DropdownMenuItem>
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
