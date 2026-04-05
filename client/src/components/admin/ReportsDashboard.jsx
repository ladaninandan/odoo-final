import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesReport, setFilters } from '../../store/slices/reportsSlice';
import reportsApi from '../../api/reportsApi';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../ui/Table';
import { formatCurrency } from '../../utils/formatCurrency';
import { getStatusLabel, getStatusVariant } from '../../utils/orderHelpers';
import { cn } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  FileDown,
  FileSpreadsheet,
  Loader2,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  PieChart,
  RefreshCw,
  AlertCircle,
  CalendarRange,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
];

function groupOrdersByDay(orders) {
  const map = new Map();
  (orders || []).forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const prev = map.get(key) || { sales: 0, count: 0 };
    map.set(key, {
      sales: prev.sales + (Number(o.total) || 0),
      count: prev.count + 1,
    });
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => {
      const [y, m, day] = date.split('-');
      const short = new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return { date, label: short, sales: v.sales, orders: v.count };
    });
}

const ReportsDashboard = () => {
  const dispatch = useDispatch();
  const { salesData, filters, salesLoading, salesError } = useSelector((state) => state.reports);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    dispatch(fetchSalesReport(filters));
  }, [dispatch, filters]);

  const handlePeriodChange = (period) => {
    dispatch(setFilters({ period }));
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const fetcher = type === 'pdf' ? reportsApi.exportPDF : reportsApi.exportXLS;
      const response = await fetcher(filters);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} exported!`);
    } catch {
      toast.error(`Failed to export ${type.toUpperCase()}`);
    }
    setExporting(null);
  };

  const summary = salesData?.summary;
  const orders = salesData?.orders || [];

  const chartData = useMemo(() => groupOrdersByDay(orders), [orders]);

  const periodLabel = PERIODS.find((p) => p.value === filters.period)?.label ?? filters.period;

  const statCards = summary
    ? [
        {
          title: 'Total sales',
          value: formatCurrency(summary.totalSales),
          hint: 'Paid orders in range',
          icon: TrendingUp,
          className:
            'border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card dark:from-primary/15',
        },
        {
          title: 'Orders',
          value: summary.totalOrders,
          hint: 'Completed payments',
          icon: ShoppingCart,
          className:
            'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card dark:from-emerald-500/15',
        },
        {
          title: 'Avg. order',
          value: formatCurrency(summary.averageOrderValue),
          hint: 'Per order',
          icon: PieChart,
          className:
            'border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-card dark:from-violet-500/15',
        },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales reports</h1>
              <p className="text-sm text-muted-foreground">
                Paid orders and revenue for the selected period. Export for accounting or review.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(fetchSalesReport(filters))}
            disabled={salesLoading}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', salesLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={!!exporting || salesLoading} className="gap-2">
            {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            PDF
          </Button>
          <Button size="sm" onClick={() => handleExport('xls')} disabled={!!exporting || salesLoading} className="gap-2">
            {exporting === 'xls' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </Button>
        </div>
      </div>

      {/* Period + error */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5 mr-1">
            <CalendarRange className="h-4 w-4 shrink-0" />
            Period
          </span>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePeriodChange(p.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  filters.period === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{periodLabel}</span> · paid orders only
        </p>
      </div>

      {salesError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{salesError}</span>
          <Button variant="outline" size="sm" onClick={() => dispatch(fetchSalesReport(filters))}>
            Retry
          </Button>
        </div>
      )}

      {/* Summary skeleton (first load only) */}
      {salesLoading && !summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {/* KPI cards — keep showing previous data while refreshing */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.title} className={cn('overflow-hidden border shadow-sm', card.className)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.hint}</p>
                  </div>
                  <div className="rounded-lg bg-background/60 p-2.5 text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sales by day</CardTitle>
            <CardDescription>Daily totals for orders in this report</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading && !orders.length ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                No chart data — no paid orders in this period
              </div>
            ) : (
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      stroke="hsl(var(--muted-foreground) / 0.5)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground) / 0.5)"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                      formatter={(value) => [formatCurrency(value), 'Sales']}
                    />
                    <Bar
                      dataKey="sales"
                      name="Sales"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={56}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Orders table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Order lines</CardTitle>
              <CardDescription>
                {salesLoading ? 'Loading…' : `${orders.length} paid order${orders.length === 1 ? '' : 's'}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {salesLoading && !orders.length ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="whitespace-nowrap">Order #</TableHead>
                    <TableHead className="whitespace-nowrap">Table</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Items</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Source</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[140px]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o._id} className="border-border">
                      <TableCell className="font-medium tabular-nums">{o.orderNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{o.table?.tableNumber ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{o.items?.length ?? 0}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(o.total)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(o.status)}>{getStatusLabel(o.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {o.source || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!orders.length && !salesLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No paid orders in this period. Try a longer range or check back after sales are completed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsDashboard;
