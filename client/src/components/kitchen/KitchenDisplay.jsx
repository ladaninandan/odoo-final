import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchKitchenOrders, advanceStage, markKitchenItemPrepared } from '../../store/slices/kitchenSlice';
import useAuth from '../../hooks/useAuth';
import { getOrderKitchenStage, getKitchenStageLabel } from '../../utils/orderHelpers';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { Toaster } from '../ui/Toaster';
import { cn } from '../../lib/utils';
import {
  ChefHat,
  CheckCircle2,
  RefreshCw,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 9;

/** Matches original kitchen column accent colors */
const stageStyles = {
  to_cook: {
    border: 'border-t-yellow-500',
    badge: 'bg-yellow-500/15 text-yellow-900 dark:text-yellow-100 border-0',
  },
  preparing: {
    border: 'border-t-orange-500',
    badge: 'bg-orange-500/15 text-orange-900 dark:text-orange-100 border-0',
  },
  completed: {
    border: 'border-t-green-500',
    badge: 'bg-green-500/15 text-green-900 dark:text-green-100 border-0',
  },
};

const tabBadgeStyles = {
  all: 'bg-secondary text-secondary-foreground',
  to_cook: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100',
  preparing: 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100',
  completed: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100',
};

function buildFlatOrders(orders) {
  return [...orders.to_cook, ...orders.preparing, ...orders.completed];
}

function orderMatchesSearch(order, q) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const num = (order.orderNumber || '').toLowerCase();
  const table = String(order.table?.tableNumber ?? '');
  const cust = (order.customer?.name || '').toLowerCase();
  const items = (order.items || []).map((i) => i.name).join(' ').toLowerCase();
  return num.includes(s) || table.includes(s) || cust.includes(s) || items.includes(s);
}

function orderMatchesProduct(order, productKey) {
  if (!productKey) return true;
  return (order.items || []).some(
    (i) => (i.name || '').trim().toLowerCase() === productKey
  );
}

function orderMatchesCategory(order, categoryId) {
  if (!categoryId) return true;
  return (order.items || []).some((item) => {
    const c = item.product?.category;
    if (!c || typeof c !== 'object') return false;
    const id = c._id != null ? String(c._id) : '';
    return id === categoryId;
  });
}

const KitchenDisplay = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { orders, isLoading } = useSelector((state) => state.kitchen);

  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [markingItemId, setMarkingItemId] = useState(null);

  useEffect(() => {
    dispatch(fetchKitchenOrders());
  }, [dispatch]);

  const flatOrders = useMemo(() => buildFlatOrders(orders), [orders]);

  const counts = useMemo(
    () => ({
      all: flatOrders.length,
      to_cook: orders.to_cook?.length || 0,
      preparing: orders.preparing?.length || 0,
      completed: orders.completed?.length || 0,
    }),
    [flatOrders.length, orders]
  );

  const productOptions = useMemo(() => {
    const map = new Map();
    flatOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const n = (item.name || '').trim();
        if (!n) return;
        const key = n.toLowerCase();
        if (!map.has(key)) map.set(key, n);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [flatOrders]);

  const categoryOptions = useMemo(() => {
    const seen = new Map();
    flatOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const c = item.product?.category;
        if (!c || typeof c !== 'object' || !c._id) return;
        const id = String(c._id);
        if (!seen.has(id)) seen.set(id, c.name || 'Category');
      });
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [flatOrders]);

  const baseList = useMemo(() => {
    if (statusFilter === 'all') return flatOrders;
    return orders[statusFilter] || [];
  }, [statusFilter, flatOrders, orders]);

  const filteredOrders = useMemo(() => {
    return baseList.filter((order) => {
      if (!orderMatchesSearch(order, searchQuery)) return false;
      if (!orderMatchesProduct(order, productFilter)) return false;
      if (!orderMatchesCategory(order, categoryFilter)) return false;
      return true;
    });
  }, [baseList, searchQuery, productFilter, categoryFilter]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, productFilter, categoryFilter, searchQuery]);

  const totalFiltered = filteredOrders.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE) || 1);
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount, totalFiltered]);
  const pageStart = totalFiltered === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const pageEnd = Math.min((safePage + 1) * PAGE_SIZE, totalFiltered);
  const visibleOrders = filteredOrders.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const clearFilters = useCallback(() => {
    setProductFilter(null);
    setCategoryFilter(null);
    setSearchQuery('');
    setPage(0);
  }, []);

  const handleAdvance = useCallback(
    async (orderId) => {
      try {
        await dispatch(advanceStage(orderId)).unwrap();
        await dispatch(fetchKitchenOrders());
        toast.success('Stage advanced');
      } catch (err) {
        toast.error(err || 'Failed');
      }
    },
    [dispatch]
  );

  const handleCardClick = useCallback(
    (order) => {
      const stage = getOrderKitchenStage(order);
      if (stage === 'completed') {
        toast.success('All items done for this ticket');
        return;
      }
      handleAdvance(order._id);
    },
    [handleAdvance]
  );

  const handleItemClick = useCallback(
    async (e, item) => {
      e.stopPropagation();
      if (item.kitchenStatus === 'completed' || markingItemId) return;
      setMarkingItemId(item._id);
      try {
        await dispatch(markKitchenItemPrepared(item._id)).unwrap();
        toast.success('Marked prepared');
      } catch (err) {
        toast.error(err || 'Failed');
      } finally {
        setMarkingItemId(null);
      }
    },
    [dispatch, markingItemId]
  );

  if (isLoading && !flatOrders.length) {
    return (
      <div className="h-screen p-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'to_cook', label: 'To Cook' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="shrink-0 border-b bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ChefHat className="h-7 w-7 text-primary shrink-0" />
            <h1 className="text-lg font-bold truncate">Kitchen Display</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/pos/floor')}>
                  POS
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  Admin
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => dispatch(fetchKitchenOrders())}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Menu className="h-5 w-5 text-muted-foreground hidden sm:block" aria-hidden />
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.key;
              const n = counts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-muted ring-1 ring-border' : 'hover:bg-muted/70'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-semibold min-w-[1.5rem] text-center',
                      tabBadgeStyles[tab.key] || 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tabular-nums px-2 min-w-[5rem] text-center text-foreground">
                {totalFiltered === 0 ? '0' : `${pageStart}–${pageEnd}`} / {totalFiltered}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-muted/30 p-3 overflow-y-auto">
          <button
            type="button"
            onClick={clearFilters}
            className="mb-4 flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <X className="h-4 w-4" /> Clear filters
          </button>

          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Product</p>
          <div className="space-y-1 mb-6">
            {productOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">No products in queue</p>
            )}
            {productOptions.map((name) => {
              const key = name.toLowerCase();
              const sel = productFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProductFilter(sel ? null : key)}
                  className={cn(
                    'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    sel ? 'bg-muted font-medium text-foreground' : 'text-foreground hover:bg-muted/80'
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Category</p>
          <div className="space-y-1">
            {categoryOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">No categories (add to products)</p>
            )}
            {categoryOptions.map(({ id, name }) => {
              const sel = categoryFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategoryFilter(sel ? null : id)}
                  className={cn(
                    'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    sel
                      ? 'bg-primary/10 font-medium text-primary ring-1 ring-primary/30'
                      : 'text-foreground hover:bg-muted/80'
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {visibleOrders.length === 0 ? (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
              No orders match your filters
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleOrders.map((order) => {
                const stage = getOrderKitchenStage(order);
                const st = stageStyles[stage] || stageStyles.to_cook;
                const elapsed = Math.round(
                  (Date.now() - new Date(order.createdAt).getTime()) / 60000
                );
                return (
                  <Card
                    key={order._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick(order)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(order);
                      }
                    }}
                    className={cn(
                      'cursor-pointer border bg-card transition hover:bg-accent/30 animate-fade-in border-t-4',
                      st.border,
                      'focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          <Badge className={cn('text-[10px] font-semibold', st.badge)}>
                            {getKitchenStageLabel(stage)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            Table {order.table?.tableNumber ?? '?'}
                          </Badge>
                          <Badge
                            variant={elapsed > 15 ? 'destructive' : elapsed > 10 ? 'warning' : 'secondary'}
                            className="text-[10px]"
                          >
                            {elapsed}m
                          </Badge>
                        </div>
                      </div>
                      {order.customer?.name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.customer.name}
                          {(order.customer.mobile || order.customer.phone)
                            ? ` · ${order.customer.mobile || order.customer.phone}`
                            : ''}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Tap row to mark prepared · Tap card to advance stage
                      </p>
                      {order.items?.map((item) => {
                        const done = item.kitchenStatus === 'completed';
                        const busy = markingItemId === item._id;
                        return (
                          <button
                            key={item._id}
                            type="button"
                            onClick={(e) => handleItemClick(e, item)}
                            disabled={done || busy}
                            className={cn(
                              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition',
                              'hover:bg-muted/60',
                              done && 'opacity-80',
                              busy && 'opacity-60'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />
                              )}
                              <span
                                className={cn(
                                  'truncate',
                                  done &&
                                    'text-muted-foreground [text-decoration-line:line-through] [text-decoration-style:dashed] [text-decoration-thickness:2px]'
                                )}
                              >
                                {item.quantity} × {item.name}
                              </span>
                            </div>
                            {busy && <span className="text-[10px] text-muted-foreground">…</span>}
                          </button>
                        );
                      })}
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic border-t pt-2">
                          Note: {order.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Mobile: compact filter chips */}
      <div className="md:hidden border-t bg-card p-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={clearFilters}>
            Clear filters
          </Button>
          {productOptions.slice(0, 8).map((name) => {
            const key = name.toLowerCase();
            const sel = productFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setProductFilter(sel ? null : key)}
                className={cn(
                  'rounded-full px-2 py-1 text-xs',
                  sel ? 'bg-muted font-medium text-foreground' : 'bg-secondary/50 text-muted-foreground'
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
        {categoryOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map(({ id, name }) => {
              const sel = categoryFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategoryFilter(sel ? null : id)}
                  className={cn(
                    'rounded-full px-2 py-1 text-xs',
                    sel
                      ? 'bg-primary/15 font-medium text-primary ring-1 ring-primary/25'
                      : 'bg-secondary/50 text-muted-foreground'
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
};

export default KitchenDisplay;
