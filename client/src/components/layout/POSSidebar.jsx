import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useAuth from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import SidebarNavSection from './SidebarNavSection';
import SidebarExternalLink from './SidebarExternalLink';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  LayoutGrid,
  Users,
  ChefHat,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  CalendarClock,
  Settings,
  Store,
  Monitor,
} from 'lucide-react';

const navLinkClass = ({ isActive }) =>
  cn(
    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
    'justify-center sm:justify-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
    isActive
      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
  );

const POSSidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const { current: session } = useSelector((state) => state.session);

  const posNav = [
    { to: '/pos/floor', label: 'Floor plan', icon: LayoutGrid, end: true },
    { to: '/pos/customers', label: 'Customers', icon: Users, end: false },
  ];

  const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList, end: false },
    { to: '/kitchen', label: 'Kitchen', icon: ChefHat, end: false },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false },
    { to: '/admin/sessions', label: 'Sessions', icon: CalendarClock, end: false },
    { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
  ];

  return (
    <aside className="flex w-[4.25rem] sm:w-56 shrink-0 flex-col border-r border-border bg-card text-card-foreground shadow-[2px_0_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_12px_-4px_rgba(0,0,0,0.35)]">
      {/* Brand */}
      <div className="p-3 sm:p-4 border-b border-border bg-muted/30">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              'bg-primary text-primary-foreground shadow-md',
              'ring-2 ring-primary/20'
            )}
            aria-hidden
          >
            <Store className="h-5 w-5 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2} />
          </div>
          <div className="min-w-0 hidden sm:block text-left space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Point of sale
            </p>
            <p className="text-sm font-bold leading-tight text-foreground truncate">Odoo POS Cafe</p>
          </div>
        </div>
        {session && (
          <div className="mt-3 space-y-2 hidden sm:block">
            <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-2.5 py-2 text-[11px] text-muted-foreground leading-snug">
              <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse" aria-hidden />
              Session active — choose a table to order.
            </div>
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-2.5 py-2 text-[11px]">
              <p className="text-muted-foreground font-medium uppercase tracking-wide text-[9px]">This session</p>
              <p className="text-sm font-semibold tabular-nums text-foreground mt-0.5">
                {formatCurrency(session.totalSales ?? 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 sm:p-3 overflow-y-auto flex flex-col gap-3">
        <SidebarNavSection title="Workspace" isFirst>
          {posNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} title={label} className={navLinkClass}>
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className="truncate hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </SidebarNavSection>

        <SidebarNavSection title="Tools">
          <SidebarExternalLink
            href="/customer-display"
            icon={Monitor}
            label="Customer screen"
            title="Open customer-facing display in a new tab / second screen"
          />
        </SidebarNavSection>

        {isAdmin && (
          <SidebarNavSection title="Back office">
            {adminNav.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} title={label} className={navLinkClass}>
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span className="truncate hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </SidebarNavSection>
        )}
      </nav>

      <div className="p-2 sm:p-3 border-t border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center sm:text-left hidden sm:block leading-relaxed">
          {location.pathname.startsWith('/pos/floor')
            ? 'Floor plan — tap a table to open the order.'
            : 'POS workspace'}
        </p>
        <p className="text-[10px] text-muted-foreground text-center sm:hidden font-medium text-primary">
          POS
        </p>
      </div>
    </aside>
  );
};

export default POSSidebar;
