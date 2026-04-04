import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../../store/slices/reportsSlice';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Award,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Flame,
  ClipboardList,
} from 'lucide-react';

const STATUS_LABEL = {
  draft: 'Draft',
  sent_to_kitchen: 'In kitchen',
  ready: 'Ready',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#a855f7', '#64748b'];

function humanizeStatus(key) {
  return STATUS_LABEL[key] || key;
}

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboard, isLoading, error } = useSelector((state) => state.reports);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  useEffect(() => {
    const id = setInterval(() => {
      dispatch(fetchDashboard());
    }, 45000);
    return () => clearInterval(id);
  }, [dispatch]);

  const pieData = useMemo(() => {
    const raw = dashboard?.ordersByStatus || {};
    return Object.entries(raw)
      .map(([name, value]) => ({
        name: humanizeStatus(name),
        key: name,
        value,
      }))
      .filter((d) => d.value > 0);
  }, [dashboard?.ordersByStatus]);

  const barData = useMemo(
    () =>
      (dashboard?.topProducts || []).slice(0, 8).map((p) => ({
        name: p.name?.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
        fullName: p.name,
        revenue: Number(p.totalRevenue) || 0,
        qty: p.totalQty,
      })),
    [dashboard?.topProducts]
  );

  const stats = [
    { label: 'Total sales (paid)', value: formatCurrency(dashboard?.totalSales), icon: DollarSign, color: 'text-green-600 bg-green-500/10' },
    { label: 'Total orders (paid)', value: dashboard?.totalOrders ?? 0, icon: ShoppingBag, color: 'text-blue-600 bg-blue-500/10' },
    { label: "Today's sales (paid)", value: formatCurrency(dashboard?.todaySales), icon: TrendingUp, color: 'text-purple-600 bg-purple-500/10' },
    { label: 'Avg order (paid)', value: formatCurrency(dashboard?.averageOrderValue), icon: Award, color: 'text-orange-600 bg-orange-500/10' },
  ];

  const liveStats = [
    {
      label: 'Open orders (not paid)',
      value: dashboard?.openOrdersCount ?? 0,
      sub: formatCurrency(dashboard?.openOrdersValue),
      icon: ClipboardList,
      color: 'text-amber-700 bg-amber-500/15',
    },
    {
      label: "Today's orders (all)",
      value: dashboard?.todayOrdersAllStatuses ?? 0,
      sub: `Pipeline ${formatCurrency(dashboard?.todayPipelineTotal)}`,
      icon: Flame,
      color: 'text-rose-700 bg-rose-500/15',
    },
  ];

  if (isLoading && !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live metrics refresh every 45s · Financial totals use <strong>paid</strong> orders only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => dispatch(fetchDashboard())}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate('/pos/floor')} className="gap-2">
            Go to POS <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 flex items-start gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Could not load dashboard</p>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => dispatch(fetchDashboard())}>
              Try again
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveStats.map((stat) => (
          <Card key={stat.label} className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales (paid) — last 7 days</CardTitle>
            <CardDescription>Daily revenue from completed payments</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {dashboard?.salesLast7Days?.some((d) => d.sales > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.salesLast7Days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                    labelFormatter={(_, p) => p?.[0]?.payload?.date || ''}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#salesFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <p>No paid sales in the last 7 days yet.</p>
                <p className="text-xs max-w-md text-center">
                  Totals above only include orders marked paid after payment. Complete checkout on the POS to see data here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>All orders in the system</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={pieData[i].key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Orders']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top products (paid orders)</CardTitle>
            <CardDescription>By quantity sold</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    formatter={(v, _n, p) => [formatCurrency(v), 'Revenue']}
                    labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ''}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No product sales yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s snapshot</CardTitle>
            <CardDescription>
              {dashboard?.todayOrders ?? 0} paid today · {dashboard?.todayOrdersAllStatuses ?? 0} orders created today
              (excl. cancelled)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(dashboard?.topProducts || []).map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-muted-foreground w-6 shrink-0">{idx + 1}</span>
                    <span className="font-medium truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm text-muted-foreground tabular-nums">{p.totalQty} sold</span>
                    <span className="font-medium tabular-nums w-24 text-right">{formatCurrency(p.totalRevenue)}</span>
                  </div>
                </div>
              ))}
              {!dashboard?.topProducts?.length && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No paid orders yet — top products appear after payments are confirmed.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
