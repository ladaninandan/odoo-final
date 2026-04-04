import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../../store/slices/authSlice';
import authApi from '../../api/authApi';
import useAuth from '../../hooks/useAuth';
import { Toaster } from '../ui/Toaster';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard, Package, Grid3X3, Armchair,
  Clock, BarChart3, Settings, LogOut, ChevronLeft, Users, UserCircle,
  ShoppingBag,
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/customers', icon: UserCircle, label: 'Customers' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: Grid3X3, label: 'Categories' },
  { to: '/admin/floors', icon: Armchair, label: 'Floors & Tables' },
  { to: '/admin/sessions', icon: Clock, label: 'Sessions' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/staff', icon: Users, label: 'Staff' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    dispatch(logoutSuccess());
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold text-primary">Odoo POS Cafe</h1>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t space-y-2">
        <button
          onClick={() => navigate('/pos/floor')}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent w-full transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to POS
        </button>
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm font-medium">{user?.first_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

const AdminLayout = () => {
  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
};

export default AdminLayout;
