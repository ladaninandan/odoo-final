import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ordersApi from '../../api/ordersApi';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../ui/Table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { getStatusLabel, getKitchenStageLabel, getStatusVariant } from '../../utils/orderHelpers';
import { cn } from '../../lib/utils';
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent_to_kitchen', label: 'In kitchen' },
  { value: 'ready', label: 'Ready' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

function OrderDetailsPanel({ order, floorName, tableNum, id }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/20 p-1 overflow-hidden">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 pl-4">Product</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Unit</th>
                <th className="px-3 py-2.5 text-right pr-4">Subtotal</th>
                <th className="px-3 py-2.5">Kitchen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80 bg-background/50">
              {(order.items || []).map((line) => (
                <tr key={line._id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-3 pl-4 align-top">
                    <div className="font-medium text-foreground">{line.name}</div>
                    {line.variant ? (
                      <div className="text-xs text-muted-foreground mt-0.5">{line.variant}</div>
                    ) : null}
                    {line.product?.name && line.product.name !== line.name ? (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Catalog: {line.product.name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground align-top">
                    {line.product?.category?.name || '—'}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums align-top">{line.quantity}</td>
                  <td className="px-3 py-3 text-right tabular-nums align-top">
                    {formatCurrency(line.unitPrice)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium pr-4 align-top">
                    {formatCurrency(line.subtotal)}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge variant="outline" className="text-[11px] font-normal whitespace-nowrap">
                      {getKitchenStageLabel(line.kitchenStatus)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Subtotal{' '}
          <strong className="ml-1.5 tabular-nums text-foreground">{formatCurrency(order.subtotal)}</strong>
        </span>
        <span className="text-muted-foreground hidden sm:inline">·</span>
        <span className="text-muted-foreground">
          Tax{' '}
          <strong className="ml-1.5 tabular-nums text-foreground">{formatCurrency(order.tax)}</strong>
        </span>
        <span className="text-muted-foreground hidden sm:inline">·</span>
        <span className="font-semibold text-foreground">
          Total{' '}
          <strong className="ml-1.5 tabular-nums text-primary text-base">{formatCurrency(order.total)}</strong>
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-primary" />
            Customer
          </div>
          {order.customer ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <dt className="text-muted-foreground shrink-0">Name</dt>
                <dd className="text-right font-medium">{order.customer.name}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground shrink-0">Mobile</dt>
                <dd className="text-right">{order.customer.mobile || order.customer.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground shrink-0">Email</dt>
                <dd className="text-right break-all">{order.customer.email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground shrink-0">City</dt>
                <dd className="text-right">{order.customer.city || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground shrink-0">Address</dt>
                <dd className="text-right text-xs leading-snug">{order.customer.address || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">Notes</dt>
                <dd className="text-right text-xs text-muted-foreground">{order.customer.notes || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No customer linked</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Table & session
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
              <dt className="text-muted-foreground">Floor</dt>
              <dd className="font-medium">{floorName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
              <dt className="text-muted-foreground">Table</dt>
              <dd>
                #{tableNum}{' '}
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {order.table?.status || '—'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1">Session</dt>
              <dd className="text-xs leading-relaxed text-foreground">
                {order.session ? (
                  <>
                    <span className="font-medium capitalize">{order.session.status}</span>
                    <span className="text-muted-foreground"> · opened </span>
                    {formatDateTime(order.session.openedAt)}
                    {order.session.closedAt ? (
                      <>
                        <span className="text-muted-foreground"> · closed </span>
                        {formatDateTime(order.session.closedAt)}
                      </>
                    ) : null}
                    {order.session.totalSales != null && (
                      <div className="mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-muted-foreground">
                        Session sales:{' '}
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatCurrency(order.session.totalSales)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Hash className="h-4 w-4 text-primary" />
            Staff & meta
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
              <dt className="text-muted-foreground">Created by</dt>
              <dd className="text-right font-medium">
                {order.createdBy
                  ? `${order.createdBy.first_name || ''} ${order.createdBy.last_name || ''}`.trim() ||
                    order.createdBy.email
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
              <dt className="text-muted-foreground">Order ID</dt>
              <dd className="max-w-[180px] truncate font-mono text-[11px] text-muted-foreground" title={id}>
                {id}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1">Order notes</dt>
              <dd className="rounded-md bg-muted/40 px-2 py-1.5 text-xs text-foreground">
                {order.notes || '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 1000 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await ordersApi.getAll(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const num = (o.orderNumber || '').toLowerCase();
      const cust = (o.customer?.name || '').toLowerCase();
      const table = String(o.table?.tableNumber ?? '');
      const floor = (o.table?.floor?.name || '').toLowerCase();
      const items = (o.items || []).map((i) => i.name).join(' ').toLowerCase();
      return (
        num.includes(q) ||
        cust.includes(q) ||
        table.includes(q) ||
        floor.includes(q) ||
        items.includes(q)
      );
    });
  }, [orders, search]);

  const toggleExpand = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-sm text-muted-foreground">
              Browse every order — expand a row for line items, customer, table, and session
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 shrink-0 self-start sm:self-auto" onClick={load} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="space-y-4 border-b bg-muted/30 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-muted-foreground" />
                Filters
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Narrow by status, then search the list</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-full sm:w-[220px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative min-w-0 flex-1 lg:min-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search order #, customer, table, items…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-9 bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground/80">Try another status or clear your search</p>
            </div>
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] caption-bottom text-sm">
                    <thead className="sticky top-0 z-10 border-b bg-muted/80 backdrop-blur-sm [&_tr]:border-b-0">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="w-12 px-4 py-3.5" aria-hidden />
                        <th className="px-4 py-3.5">Order</th>
                        <th className="px-4 py-3.5">Placed</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Source</th>
                        <th className="px-4 py-3.5">Location</th>
                        <th className="px-4 py-3.5">Customer</th>
                        <th className="px-4 py-3.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((order, idx) => {
                        const id = order._id;
                        const open = expandedId === id;
                        const floorName = order.table?.floor?.name || '—';
                        const tableNum = order.table?.tableNumber ?? '—';
                        return (
                          <React.Fragment key={id}>
                            <tr
                              className={cn(
                                'group border-b transition-colors cursor-pointer',
                                idx % 2 === 0 ? 'bg-background' : 'bg-muted/15',
                                open && 'bg-primary/[0.06] shadow-[inset_4px_0_0_0_hsl(var(--primary))]',
                                'hover:bg-muted/40'
                              )}
                              onClick={() => toggleExpand(id)}
                            >
                              <td className="px-4 py-3 align-middle">
                                <button
                                  type="button"
                                  className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg border bg-background/80 transition-colors',
                                    'hover:bg-muted group-hover:border-primary/30'
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(id);
                                  }}
                                  aria-label={open ? 'Collapse details' : 'Expand details'}
                                  aria-expanded={open}
                                >
                                  {open ? (
                                    <ChevronDown className="h-4 w-4 text-primary" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <span className="font-semibold tabular-nums text-foreground">{order.orderNumber}</span>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                  <span className="whitespace-nowrap text-xs sm:text-sm">{formatDateTime(order.createdAt)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <Badge variant={getStatusVariant(order.status)} className="font-normal">
                                  {getStatusLabel(order.status)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                                  {(order.source || 'pos').replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <span className="text-muted-foreground">{floorName}</span>
                                  <span className="text-muted-foreground/50">·</span>
                                  <span className="font-medium">T{tableNum}</span>
                                </div>
                              </td>
                              <td className="max-w-[200px] px-4 py-3 align-middle">
                                <span className="line-clamp-2 text-sm">{order.customer?.name || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-right align-middle">
                                <span className="text-base font-semibold tabular-nums tracking-tight">
                                  {formatCurrency(order.total)}
                                </span>
                              </td>
                            </tr>
                            {open && (
                              <tr className="border-b bg-muted/25">
                                <td colSpan={8} className="p-0">
                                  <div className="border-t border-border/80 bg-gradient-to-b from-muted/20 to-background p-5 sm:p-6">
                                    <OrderDetailsPanel order={order} floorName={floorName} tableNum={tableNum} id={id} />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {filtered.map((order) => {
                  const id = order._id;
                  const open = expandedId === id;
                  const floorName = order.table?.floor?.name || '—';
                  const tableNum = order.table?.tableNumber ?? '—';
                  return (
                    <div key={id} className="bg-background">
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-start gap-3 p-4 text-left transition-colors',
                          open ? 'bg-primary/[0.06]' : 'active:bg-muted/50'
                        )}
                        onClick={() => toggleExpand(id)}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card',
                            open && 'border-primary/40 bg-primary/5'
                          )}
                        >
                          {open ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">{order.orderNumber}</span>
                            <Badge variant={getStatusVariant(order.status)} className="shrink-0">
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="text-muted-foreground">
                              {floorName} · T{tableNum}
                            </span>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="truncate font-medium">{order.customer?.name || '—'}</span>
                          </div>
                          <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(order.total)}</p>
                        </div>
                      </button>
                      {open && (
                        <div className="border-t bg-muted/20 px-4 pb-5 pt-2">
                          <OrderDetailsPanel order={order} floorName={floorName} tableNum={tableNum} id={id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing <strong className="text-foreground">{filtered.length}</strong> order
                {filtered.length !== 1 ? 's' : ''}
                {search.trim() ? ' (filtered)' : ''}
              </span>
              <span className="tabular-nums">Up to 1000 loaded · use filters to narrow</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
