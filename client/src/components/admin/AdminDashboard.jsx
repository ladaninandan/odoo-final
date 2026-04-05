import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../../store/slices/reportsSlice';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { cn } from '../../lib/utils';
import { ScrollReveal } from '../ui/ScrollReveal';
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
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';

const STATUS_LABEL = {
  draft: 'Draft',
  sent_to_kitchen: 'In kitchen',
  ready: 'Ready',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#a855f7', '#64748b'];

const CHART_ANIMATION = { duration: 900, easing: 'ease-out' };

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
    {
      label: 'Total sales (paid)',
      value: formatCurrency(dashboard?.totalSales),
      icon: DollarSign,
      accent: 'from-emerald-500/12 to-card dark:from-emerald-500/18 border-emerald-500/20',
      iconWrap: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total orders (paid)',
      value: dashboard?.totalOrders ?? 0,
      icon: ShoppingBag,
      accent: 'from-sky-500/12 to-card dark:from-sky-500/18 border-sky-500/20',
      iconWrap: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    },
    {
      label: "Today's sales (paid)",
      value: formatCurrency(dashboard?.todaySales),
      icon: TrendingUp,
      accent: 'from-violet-500/12 to-card dark:from-violet-500/18 border-violet-500/20',
      iconWrap: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Avg order (paid)',
      value: formatCurrency(dashboard?.averageOrderValue),
      icon: Award,
      accent: 'from-amber-500/12 to-card dark:from-amber-500/18 border-amber-500/20',
      iconWrap: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
  ];

  const liveStats = [
    {
      label: 'Open orders (not paid)',
      value: dashboard?.openOrdersCount ?? 0,
      sub: formatCurrency(dashboard?.openOrdersValue),
      icon: ClipboardList,
      accent: 'border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] to-card',
      iconWrap: 'text-amber-700 bg-amber-500/15 dark:text-amber-400',
    },
    {
      label: "Today's orders (all)",
      value: dashboard?.todayOrdersAllStatuses ?? 0,
      sub: `Pipeline ${formatCurrency(dashboard?.todayPipelineTotal)}`,
      icon: Flame,
      accent: 'border-rose-500/25 bg-gradient-to-br from-rose-500/[0.08] to-card',
      iconWrap: 'text-rose-700 bg-rose-500/15 dark:text-rose-400',
    },
  ];

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    boxShadow: '0 8px 24px hsl(var(--foreground) / 0.08)',
  };

  if (isLoading && !dashboard) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-scale motion-reduce:animate-none">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <ScrollReveal>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm ring-1 ring-primary/15">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Metrics refresh every <strong className="text-foreground font-medium">45s</strong>. Financial totals use{' '}
                <strong className="text-foreground font-medium">paid</strong> orders only.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl transition-all duration-200 hover:bg-accent"
              onClick={() => dispatch(fetchDashboard())}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4 transition-transform duration-500', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-2 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => navigate('/pos/floor')}
            >
              Go to POS
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ScrollReveal>

      {error && (
        <ScrollReveal>
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-4 flex items-start gap-3 text-sm"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-destructive">Could not load dashboard</p>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3 rounded-lg" onClick={() => dispatch(fetchDashboard())}>
              Try again
            </Button>
          </div>
        </div>
        </ScrollReveal>
      )}

      {/* KPI grid — each card reveals on scroll with staggered delay */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 75}>
            <Card
              className={cn(
                'group overflow-hidden border bg-gradient-to-br shadow-sm',
                'transition-all duration-300 ease-out',
                'hover:shadow-lg hover:-translate-y-1 hover:border-primary/20',
                'motion-reduce:hover:translate-y-0',
                stat.accent,
              )}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100',
                      stat.iconWrap,
                    )}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {/* Live strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveStats.map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 90}>
            <Card
              className={cn(
                'overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md',
                stat.accent,
              )}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">{stat.sub}</p>
                  </div>
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', stat.iconWrap)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 overflow-hidden border shadow-sm transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-lg">Sales (paid) — last 7 days</CardTitle>
              <CardDescription>Daily revenue from completed payments</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-6">
              {dashboard?.salesLast7Days?.some((d) => d.sales > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard.salesLast7Days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFillDash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground) / 0.5)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground) / 0.5)"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Sales']}
                      labelFormatter={(_, p) => p?.[0]?.payload?.date || ''}
                      contentStyle={tooltipStyle}
                      labelStyle={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#salesFillDash)"
                      isAnimationActive
                      animationDuration={CHART_ANIMATION.duration}
                      animationEasing={CHART_ANIMATION.easing}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 px-4 animate-fade-in">
                  <p>No paid sales in the last 7 days yet.</p>
                  <p className="text-xs max-w-md text-center text-muted-foreground/80">
                    Totals above only include orders marked paid after payment. Complete checkout on the POS to see data here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-lg">Orders by status</CardTitle>
              <CardDescription>All orders in the system</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={CHART_ANIMATION.duration}
                      animationEasing={CHART_ANIMATION.easing}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={pieData[i].key} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No orders yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden border shadow-sm transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-lg">Top products (paid orders)</CardTitle>
              <CardDescription>By quantity sold</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-4">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground) / 0.5)" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground) / 0.5)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Revenue']}
                      labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ''}
                      contentStyle={tooltipStyle}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="hsl(var(--primary))"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={28}
                      isAnimationActive
                      animationDuration={CHART_ANIMATION.duration}
                      animationEasing={CHART_ANIMATION.easing}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No product sales yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-lg">Today&apos;s snapshot</CardTitle>
              <CardDescription>
                {dashboard?.todayOrders ?? 0} paid today · {dashboard?.todayOrdersAllStatuses ?? 0} orders created today
                (excl. cancelled)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1">
                {(dashboard?.topProducts || []).map((p, idx) => (
                  <div
                    key={p.name}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg px-3 py-2.5',
                      'transition-colors duration-200 hover:bg-muted/60',
                      'opacity-0 animate-fade-in-up motion-reduce:opacity-100 motion-reduce:animate-none',
                    )}
                    style={{ animationDelay: `${200 + idx * 40}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm text-muted-foreground tabular-nums">{p.totalQty} sold</span>
                      <span className="font-semibold tabular-nums w-28 text-right text-foreground">{formatCurrency(p.totalRevenue)}</span>
                    </div>
                  </div>
                ))}
                {!dashboard?.topProducts?.length && (
                  <p className="text-center text-muted-foreground py-12 text-sm">
                    No paid orders yet — top products appear after payments are confirmed.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default AdminDashboard;
