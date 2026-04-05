import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchKitchenOrders, advanceStage, markKitchenItemPrepared } from '../../store/slices/kitchenSlice';
import { logoutSuccess } from '../../store/slices/authSlice';
import authApi from '../../api/authApi';
import useAuth from '../../hooks/useAuth';
import { getOrderKitchenStage, getKitchenStageLabel } from '../../utils/orderHelpers';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { Toaster } from '../ui/Toaster';
import { Separator } from '../ui/Separator';
import { cn } from '../../lib/utils';
import {
  ChefHat,
  CheckCircle2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Clock,
  Filter,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import categoriesApi from '../../api/categoriesApi';
import productsApi from '../../api/productsApi';

const PAGE_SIZE = 9;

/** Stage: slim top accent + neutral-friendly badges */
const stageStyles = {
  to_cook: {
    bar: 'bg-amber-500',
    badge: 'border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
  preparing: {
    bar: 'bg-orange-500',
    badge: 'border border-orange-500/20 bg-orange-500/10 text-orange-800 dark:text-orange-300',
  },
  completed: {
    bar: 'bg-emerald-600',
    badge: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  },
};

const filterPanelClass = 'rounded-md border border-border bg-muted/40 p-2';
const sidebarBtn =
  'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors';
const sidebarBtnActive = 'bg-background font-medium shadow-sm ring-1 ring-border';
const sidebarBtnIdle = 'hover:bg-background/80';
const sidebarSubBtn =
  'flex w-full items-center rounded-md px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground';
const sidebarSectionBtn =
  'mb-2 flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/60';

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

/** Lines under a catalog product for variant "sub-products" in the sidebar */
function variantSubLines(product) {
  const lines = [];
  (product.variants || []).forEach((v) => {
    (v.values || []).forEach((val) => {
      const attr = (v.attribute || '').trim();
      const label = (val.label || '').trim();
      if (!label && !attr) return;
      lines.push(attr ? `${attr}: ${label}` : label);
    });
  });
  return lines;
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

  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [productSectionOpen, setProductSectionOpen] = useState(true);
  const [categorySectionOpen, setCategorySectionOpen] = useState(true);

  useEffect(() => {
    dispatch(fetchKitchenOrders());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          categoriesApi.getAll(),
          productsApi.getAll({ active: 'true' }),
        ]);
        if (!cancelled) {
          setCatalogCategories(Array.isArray(catRes.data) ? catRes.data : []);
          setCatalogProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        }
      } catch {
        if (!cancelled) toast.error('Could not load menu for filters');
      } finally {
        if (!cancelled) setCatalogLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const categoriesForSidebar = useMemo(() => {
    if (catalogCategories.length > 0) {
      return catalogCategories
        .map((c) => ({ id: String(c._id), name: c.name || 'Category' }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    if (catalogProducts.length > 0) {
      const catMap = new Map();
      catalogProducts.forEach((p) => {
        const c = p.category;
        if (c && typeof c === 'object' && c._id != null) {
          catMap.set(String(c._id), c.name || 'Category');
        }
      });
      if (catMap.size > 0) {
        return Array.from(catMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    return categoryOptions;
  }, [catalogCategories, categoryOptions, catalogProducts]);

  const productsByCategoryId = useMemo(() => {
    const map = new Map();
    catalogProducts.forEach((p) => {
      const raw = p.category;
      const cid =
        raw && typeof raw === 'object' && raw._id != null
          ? String(raw._id)
          : raw != null
            ? String(raw)
            : '';
      if (!cid) return;
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid).push(p);
    });
    map.forEach((arr) => arr.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    return map;
  }, [catalogProducts]);

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

  const activeProductLabel = useMemo(() => {
    if (!productFilter) return null;
    const hit = productOptions.find((n) => n.toLowerCase() === productFilter);
    return hit || productFilter;
  }, [productFilter, productOptions]);

  const activeCategoryLabel = useMemo(() => {
    if (!categoryFilter) return null;
    return categoriesForSidebar.find((c) => c.id === categoryFilter)?.name ?? null;
  }, [categoryFilter, categoriesForSidebar]);

  const kitchenProductPanel = useMemo(
    () => (
      <div className="space-y-3">
        {!catalogLoaded && (
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
            Loading menu…
          </p>
        )}
        {catalogLoaded && catalogProducts.length === 0 && productOptions.length === 0 && (
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
            No products in queue
          </p>
        )}
        {catalogProducts.length > 0
          ? categoriesForSidebar.map(({ id: catId, name: catName }) => {
              const prods = productsByCategoryId.get(catId) || [];
              if (prods.length === 0) return null;
              return (
                <div key={catId} className={filterPanelClass}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{catName}</p>
                  <div className="space-y-1">
                    {prods.map((p) => {
                      const name = (p.name || '').trim() || 'Product';
                      const key = name.toLowerCase();
                      const sel = productFilter === key;
                      const sub = variantSubLines(p);
                      return (
                        <div key={p._id || key}>
                          <button
                            type="button"
                            onClick={() => setProductFilter(sel ? null : key)}
                            className={cn(sidebarBtn, sel ? sidebarBtnActive : sidebarBtnIdle)}
                          >
                            <span className="min-w-0 flex-1 break-words">{name}</span>
                          </button>
                          {sub.length > 0 && (
                            <ul className="ml-2 mt-1 space-y-0.5 border-l border-border pl-2 text-[11px] text-muted-foreground">
                              {sub.map((line, i) => (
                                <li key={`${key}-${i}`} className="break-words">
                                  {line}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          : productOptions.map((name) => {
              const key = name.toLowerCase();
              const sel = productFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProductFilter(sel ? null : key)}
                  className={cn(sidebarBtn, sel ? sidebarBtnActive : sidebarBtnIdle)}
                >
                  <span className="min-w-0 flex-1 break-words">{name}</span>
                </button>
              );
            })}
      </div>
    ),
    [
      catalogLoaded,
      catalogProducts,
      categoriesForSidebar,
      productsByCategoryId,
      productOptions,
      productFilter,
    ]
  );

  const kitchenCategoryPanel = useMemo(
    () => (
      <div className={filterPanelClass}>
        <div className="space-y-2">
          {!catalogLoaded && (
            <p className="rounded-md bg-muted/50 px-2 py-2 text-center text-xs text-muted-foreground">
              Loading menu…
            </p>
          )}
          {catalogLoaded && categoriesForSidebar.length === 0 && (
            <p className="rounded-md bg-muted/50 px-2 py-2 text-center text-xs text-muted-foreground">
              No categories (add to products)
            </p>
          )}
          {categoriesForSidebar.map(({ id, name }) => {
            const sel = categoryFilter === id;
            const subProds = productsByCategoryId.get(id) || [];
            return (
              <div key={id} className="border-b border-border/60 py-1 last:border-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setCategoryFilter(sel ? null : id)}
                  className={cn(
                    sidebarBtn,
                    sel ? 'font-medium text-primary' : sidebarBtnIdle
                  )}
                >
                  <span className="min-w-0 flex-1 break-words">{name}</span>
                </button>
                {subProds.length > 0 && (
                  <ul className="ml-2 mt-0.5 space-y-0 border-l border-border pl-2">
                    {subProds.map((p) => {
                      const pname = (p.name || '').trim() || 'Product';
                      const pkey = pname.toLowerCase();
                      const pSel = productFilter === pkey;
                      return (
                        <li key={p._id || pkey}>
                          <button
                            type="button"
                            onClick={() => setProductFilter(pSel ? null : pkey)}
                            className={cn(
                              sidebarSubBtn,
                              pSel ? 'font-medium text-foreground' : ''
                            )}
                          >
                            <span className="min-w-0 flex-1 break-words">{pname}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ),
    [catalogLoaded, categoriesForSidebar, productsByCategoryId, categoryFilter, productFilter]
  );

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

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    dispatch(logoutSuccess());
    navigate('/login');
  }, [dispatch, navigate]);

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
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </div>
        </div>
        <div className="bg-muted/30 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-44 rounded-lg border border-border/60" />
            ))}
          </div>
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
    <div className="flex h-screen min-h-0 flex-col bg-background text-foreground">
      <header className="shrink-0 border-b bg-card">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ChefHat className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold md:text-lg">Kitchen</h1>
              <p className="truncate text-xs text-muted-foreground">Order queue</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => dispatch(fetchKitchenOrders())}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1920px] flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="inline-flex w-fit flex-wrap gap-0.5 rounded-md bg-muted p-0.5">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.key;
              const n = counts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                  <span className="tabular-nums text-xs text-muted-foreground">{n}</span>
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <div className="relative min-w-0 flex-1 md:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-md border-border bg-background pl-8"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[4.5rem] text-center tabular-nums">
                <span className="text-foreground">{totalFiltered === 0 ? '0' : `${pageStart}–${pageEnd}`}</span> /{' '}
                {totalFiltered}
              </span>
              <Button
                type="button"
                variant="outline"
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

      <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1">
        <aside className="hidden min-h-0 w-64 shrink-0 border-r bg-muted/30 md:flex md:min-h-0 md:flex-col lg:w-72">
          <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
              Filters
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition hover:bg-muted/50"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              Clear all
            </button>
            {(productFilter || categoryFilter) && (
              <div className="flex flex-wrap gap-1.5">
                {categoryFilter && activeCategoryLabel && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter(null)}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground">{activeCategoryLabel}</span>
                    <X className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                )}
                {productFilter && activeProductLabel && (
                  <button
                    type="button"
                    onClick={() => setProductFilter(null)}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground">{activeProductLabel}</span>
                    <X className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 [scrollbar-gutter:stable]">
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setProductSectionOpen((o) => !o)}
                  className={sidebarSectionBtn}
                  aria-expanded={productSectionOpen}
                >
                  Products
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                      productSectionOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>
                {productSectionOpen && <div className="mt-3">{kitchenProductPanel}</div>}
              </div>

              <Separator className="bg-border/60" />

              <div>
                <button
                  type="button"
                  onClick={() => setCategorySectionOpen((o) => !o)}
                  className={sidebarSectionBtn}
                  aria-expanded={categorySectionOpen}
                >
                  Categories
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                      categorySectionOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </button>
                {categorySectionOpen && <div className="mt-3">{kitchenCategoryPanel}</div>}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-4 md:px-6">
          {visibleOrders.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-12 text-center">
              <ChefHat className="mb-3 h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No orders</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Change filters or queue tab to see tickets.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleOrders.map((order) => {
                const stage = getOrderKitchenStage(order);
                const st = stageStyles[stage] || stageStyles.to_cook;
                const elapsed = Math.round(
                  (Date.now() - new Date(order.createdAt).getTime()) / 60000
                );
                const items = order.items || [];
                const doneCount = items.filter((i) => i.kitchenStatus === 'completed').length;
                const nItems = items.length;
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
                      'cursor-pointer overflow-hidden rounded-lg border bg-card transition-shadow animate-fade-in',
                      'hover:shadow-md',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    <div className={cn('h-0.5 w-full', st.bar)} />
                    <CardHeader className="space-y-3 pb-2 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="font-mono text-sm font-semibold tracking-tight">
                            {order.orderNumber}
                          </CardTitle>
                          {order.customer?.name && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {order.customer.name}
                              {(order.customer.mobile || order.customer.phone)
                                ? ` · ${order.customer.mobile || order.customer.phone}`
                                : ''}
                            </p>
                          )}
                          {nItems > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {doneCount}/{nItems} prepared
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span
                            className={cn(
                              'rounded-md border px-2 py-0.5 text-[11px] font-medium',
                              st.badge
                            )}
                          >
                            {getKitchenStageLabel(stage)}
                          </span>
                          <div className="flex flex-wrap justify-end gap-1 text-[11px] text-muted-foreground">
                            <span className="tabular-nums">Table {order.table?.tableNumber ?? '—'}</span>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-0.5 tabular-nums">
                              <Clock className="h-3 w-3" />
                              {elapsed}m
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-0 pb-4 pt-0">
                      <div className="divide-y divide-border rounded-md border bg-background">
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
                                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                                'hover:bg-muted/50',
                                done && 'bg-muted/30',
                                busy && 'opacity-50'
                              )}
                            >
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                              ) : (
                                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/40" />
                              )}
                              <span
                                className={cn(
                                  'min-w-0 flex-1 leading-snug',
                                  done && 'text-muted-foreground line-through'
                                )}
                              >
                                <span className="tabular-nums text-muted-foreground">{item.quantity}×</span>{' '}
                                {item.name}
                              </span>
                              {busy && <span className="text-xs text-muted-foreground">…</span>}
                            </button>
                          );
                        })}
                      </div>
                      {order.notes && (
                        <p className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                          {order.notes}
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

      {/* Mobile filters */}
      <div className="shrink-0 border-t bg-card md:hidden">
        <div className="max-h-[min(50vh,26rem)] space-y-3 overflow-y-auto p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
            Filters
          </div>
          <Button variant="outline" size="sm" className="h-9 w-full" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear all
          </Button>
          {(productFilter || categoryFilter) && (
            <div className="flex flex-wrap gap-1.5">
              {categoryFilter && activeCategoryLabel && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter(null)}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs"
                >
                  <span className="truncate text-muted-foreground">{activeCategoryLabel}</span>
                  <X className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              )}
              {productFilter && activeProductLabel && (
                <button
                  type="button"
                  onClick={() => setProductFilter(null)}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs"
                >
                  <span className="truncate text-muted-foreground">{activeProductLabel}</span>
                  <X className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              )}
            </div>
          )}
          <details className="rounded-md border bg-background">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Products
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </summary>
            <div className="max-h-48 overflow-y-auto border-t px-2 py-2">
              {kitchenProductPanel}
            </div>
          </details>
          <details className="rounded-md border bg-background">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Categories
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </summary>
            <div className="max-h-44 overflow-y-auto border-t px-2 py-2">
              {kitchenCategoryPanel}
            </div>
          </details>
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default KitchenDisplay;
