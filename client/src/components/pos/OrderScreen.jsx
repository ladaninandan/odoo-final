import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice';
import {
  cartSlice,
  addItem,
  removeItem,
  updateQuantity,
  clearLineItems,
  setActiveTable,
  setActiveCustomer,
  loadExistingOrder,
} from '../../store/slices/cartSlice';
import { createOrder, sendToKitchen, updateOrder, setCurrentOrder } from '../../store/slices/ordersSlice';
import { fetchFloors, updateTableStatus } from '../../store/slices/floorsSlice';
import tablesApi from '../../api/tablesApi';
import ordersApi from '../../api/ordersApi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';
import { ScrollReveal } from '../ui/ScrollReveal';
import { formatCurrency } from '../../utils/formatCurrency';
import { getKitchenStageLabel } from '../../utils/orderHelpers';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  ShoppingCart,
  X,
  User,
  CreditCard,
  AlertCircle,
  Lock,
  UtensilsCrossed,
  Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getMediaAbsoluteUrl } from '../../utils/lanServerUrl';
import CustomerSelectDialog from './CustomerSelectDialog';

/** Temporary placeholder until product images are set in admin (served from /public) */
const PRODUCT_IMAGE_PLACEHOLDER = `${process.env.PUBLIC_URL || ''}/placeholders/product-placeholder.svg`;

function productCardImageSrc(product) {
  return product?.image ? getMediaAbsoluteUrl(product.image) : PRODUCT_IMAGE_PLACEHOLDER;
}

function lineItemImageSrc(item) {
  return item?.image ? getMediaAbsoluteUrl(item.image) : PRODUCT_IMAGE_PLACEHOLDER;
}

function mapCartToOrderItems(items) {
  return items.map((i) => {
    const base = {
      productId: typeof i.productId === 'object' && i.productId?._id != null
        ? String(i.productId._id)
        : String(i.productId),
      name: i.name,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      variant: i.variant || '',
      kitchenStatus: i.kitchenStatus || 'pending',
    };
    if (i.locked && i.cartLineId) {
      base.orderLineId = String(i.cartLineId);
    }
    return base;
  });
}

const OrderScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { list: products, categories, isLoading } = useSelector((state) => state.products);
  const { items, subtotal, tax, total, activeTable, activeCustomer, activeOrder } = useSelector((state) => state.cart);
  const { current: session } = useSelector((state) => state.session);
  const currentOrderFull = useSelector((state) => state.orders.currentOrder);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [resumeReady, setResumeReady] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setResumeReady(false);
      try {
        const { data } = await tablesApi.getAll({ floor: '' });
        const table = data.find((t) => String(t._id) === String(tableId));
        if (!table) {
          toast.error('Table not found');
          navigate('/pos/floor');
          return;
        }
        dispatch(setActiveTable(table));

        if (table.status === 'occupied' && table.currentOrder) {
          const oid = table.currentOrder._id || table.currentOrder;
          const { data: order } = await ordersApi.getById(oid);
          if (cancelled) return;
          if (order.status === 'paid') {
            toast.error('This order is already paid. Table should be available.');
            navigate('/pos/floor');
            return;
          }
          dispatch(loadExistingOrder(order));
          dispatch(setCurrentOrder(order));
          if (order.customer) {
            dispatch(setActiveCustomer(order.customer));
          } else if (order.source === 'self_order') {
            dispatch(setActiveCustomer({
              _id: `self-order-guest-${order._id}`,
              name: (order.guestName && String(order.guestName).trim()) || 'Guest',
              mobile: (order.guestPhone && String(order.guestPhone).trim()) || '',
              phone: (order.guestPhone && String(order.guestPhone).trim()) || '',
              isSelfOrderGuest: true,
            }));
          }
        }
      } catch (e) {
        console.error(e);
        toast.error('Could not load table');
        navigate('/pos/floor');
      } finally {
        if (!cancelled) setResumeReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch, tableId, navigate]);

  const filteredProducts = products.filter((p) => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !selectedCategory || p.category?._id === selectedCategory;
    return p.isActive && matchSearch && matchCategory;
  });

  const handleAddItem = useCallback((product) => {
    dispatch(addItem({
      productId: product._id,
      name: product.name,
      unitPrice: product.price,
      image: product.image,
      kitchenStatus: 'pending',
    }));
  }, [dispatch]);

  const handleSubmitOrder = async () => {
    if (!items.length) return toast.error('Cart is empty');
    if (!activeCustomer?._id) {
      toast.error('Select a customer first');
      setCustomerDialogOpen(true);
      return;
    }
    if (!session) {
      toast.error('Open a session first');
      return;
    }

    const itemsPayload = mapCartToOrderItems(items);

    try {
      if (activeOrder) {
        const updated = await dispatch(updateOrder({
          id: activeOrder,
          data: { items: itemsPayload },
        })).unwrap();
        dispatch(setCurrentOrder(updated));
        await dispatch(sendToKitchen(activeOrder)).unwrap();
        toast.success(`Order ${updated.orderNumber} updated & sent to kitchen`);
      } else {
        const order = await dispatch(createOrder({
          tableId: String(tableId),
          sessionId: session?._id != null ? String(session._id) : undefined,
          customerId: String(activeCustomer._id),
          source: 'pos',
          items: itemsPayload.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            variant: i.variant || '',
          })),
        })).unwrap();

        const tableRef = order.table?._id ?? order.table ?? tableId;
        dispatch(updateTableStatus({ tableId: tableRef, status: 'occupied' }));

        await dispatch(sendToKitchen(order._id)).unwrap();
        dispatch(setCurrentOrder(order));
        toast.success(`Order ${order.orderNumber} confirmed & sent to kitchen`);
      }

      dispatch(clearLineItems());
      dispatch(setCurrentOrder(null));
      dispatch(fetchFloors());
      navigate('/pos/floor');
    } catch (err) {
      toast.error(err || 'Failed to save order');
    }
  };

  const handlePayNow = async () => {
    if (!activeOrder) return;
    if (!canPayNow) {
      toast.error('Wait until every item is completed in the kitchen before taking payment.');
      return;
    }
    if (!session) {
      toast.error('Open a session first');
      return;
    }
    try {
      const itemsPayload = mapCartToOrderItems(items);
      if (items.length) {
        const updated = await dispatch(updateOrder({
          id: activeOrder,
          data: { items: itemsPayload },
        })).unwrap();
        dispatch(setCurrentOrder(updated));
        await dispatch(sendToKitchen(activeOrder)).unwrap();
      }
      const { data: order } = await ordersApi.getById(activeOrder);
      dispatch(setCurrentOrder(order));
      navigate(`/pos/payment/${activeOrder}`);
    } catch (err) {
      toast.error(err || 'Could not prepare payment');
    }
  };

  const unpaid = Boolean(activeOrder);

  const canPayNow = useMemo(() => {
    if (!activeOrder || !items.length) return false;
    return items.every((i) => i.locked && i.kitchenStatus === 'completed');
  }, [activeOrder, items]);

  useEffect(() => {
    if (!activeOrder || canPayNow) return undefined;
    const t = setInterval(async () => {
      try {
        const { data } = await ordersApi.getById(activeOrder);
        dispatch(cartSlice.actions.mergeServerOrderIntoCart(data));
        dispatch(setCurrentOrder(data));
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [activeOrder, canPayNow, dispatch]);

  const displayOrderNumber =
    currentOrderFull && activeOrder && String(currentOrderFull._id) === String(activeOrder)
      ? currentOrderFull.orderNumber
      : null;

  if (!resumeReady) {
    return (
      <div className="h-full min-h-0 flex flex-col bg-muted/20">
        <div className="border-b border-border bg-card px-6 py-4">
          <Skeleton className="h-8 w-64 max-w-full rounded-lg" />
        </div>
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          </div>
          <Skeleton className="h-full min-h-[320px] rounded-2xl hidden lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-muted/25">
      {/* Table & order context */}
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur-sm shadow-sm">
        <ScrollReveal className="w-full">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-md ring-2 ring-primary/20">
              {activeTable?.tableNumber ?? '—'}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current table
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-semibold text-foreground truncate">
                  Table {activeTable?.tableNumber ?? '—'}
                  {activeTable?.seats != null && (
                    <span className="font-normal text-muted-foreground">
                      {' '}
                      · {activeTable.seats} seats
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {session && (
              <Badge variant="outline" className="text-xs font-normal border-primary/30 bg-primary/5">
                Till open
              </Badge>
            )}
            {displayOrderNumber && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-1.5">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Order</span>
                <span className="text-sm font-mono font-semibold">{displayOrderNumber}</span>
              </div>
            )}
            {unpaid && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-950 hover:bg-amber-100 border-amber-200">
                Payment pending
              </Badge>
            )}
          </div>
        </div>
        </ScrollReveal>
      </header>

      <div className="flex-1 flex min-h-0 min-w-0">
        {/* Menu */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="shrink-0 p-4 sm:p-5 pb-2 space-y-4 ">
            <ScrollReveal>
            <Card className="border-border/80 shadow-sm overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search menu…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-border/80 bg-background"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-muted"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
                  <Button
                    type="button"
                    variant={!selectedCategory ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full shrink-0"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat._id}
                      type="button"
                      variant={selectedCategory === cat._id ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full shrink-0 gap-1.5"
                      onClick={() => setSelectedCategory(cat._id)}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            </ScrollReveal>
          </div>

          <div className="flex-1 overflow-auto px-4 sm:px-5 pb-6">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
                {filteredProducts.map((product, cardIndex) => {
                  const linesForProduct = items.filter((i) => i.productId === product._id);
                  const unlockedQty = linesForProduct
                    .filter((i) => !i.locked)
                    .reduce((s, i) => s + i.quantity, 0);
                  const lockedQty = linesForProduct
                    .filter((i) => i.locked)
                    .reduce((s, i) => s + i.quantity, 0);
                  const highlightNew = unlockedQty > 0;
                  const highlightSentOnly = unlockedQty === 0 && lockedQty > 0;
                  return (
                    <ScrollReveal key={product._id} delay={Math.min(cardIndex, 20) * 32}>
                    <Card
                      onClick={() => handleAddItem(product)}
                      className={cn(
                        'group cursor-pointer overflow-hidden rounded-2xl border-border/70 shadow-sm transition-all duration-200',
                        'hover:shadow-lg hover:border-primary/35 hover:-translate-y-0.5',
                        highlightNew && 'ring-2 ring-primary shadow-md border-primary/40',
                        highlightSentOnly && 'ring-2 ring-muted-foreground/25'
                      )}
                    >
                      <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                        <img
                          src={productCardImageSrc(product)}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {unlockedQty > 0 && (
                            <Badge className="text-xs shadow-md bg-primary">×{unlockedQty}</Badge>
                          )}
                          {unlockedQty === 0 && lockedQty > 0 && (
                            <Badge variant="secondary" className="text-xs gap-0.5 shadow-md">
                              <Lock className="h-3 w-3" />
                              {lockedQty}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-3.5 space-y-2">
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        <div className="flex items-end justify-between gap-2">
                          <span className="text-base font-bold text-primary tabular-nums">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                        {product.category && (
                          <span
                            className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${product.category.color}18`,
                              color: product.category.color,
                            }}
                          >
                            {product.category.icon} {product.category.name}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
            {!isLoading && !filteredProducts.length && (
              <ScrollReveal>
              <Card className="border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-foreground">No products match</p>
                  <p className="text-sm mt-1">Try another search or category.</p>
                </CardContent>
              </Card>
              </ScrollReveal>
            )}
          </div>
        </div>

        {/* Cart */}
        <aside className="w-full sm:w-[360px] lg:w-[400px] xl:w-[420px] shrink-0 border-l border-border bg-card flex flex-col min-h-0 shadow-[ -4px_0_24px_-12px_rgba(0,0,0,0.08)]">
          <ScrollReveal className="flex flex-1 flex-col h-full min-h-0 min-w-0 w-full" rootMargin="0px 0px -12px 0px" threshold={0.04}>
          <Card className="flex flex-col h-full min-h-0 rounded-none border-0 shadow-none bg-transparent">
            <CardHeader className="shrink-0 space-y-4 pb-4 border-b border-border/80 px-5 pt-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Order
                  </CardTitle>
                  <CardDescription>Items in this bill</CardDescription>
                </div>
                {items.length > 0 && !activeOrder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs shrink-0"
                    onClick={() => dispatch(clearLineItems())}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {unpaid && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2.5 flex gap-2.5 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-950 dark:text-amber-100">Payment pending</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Add items, then pay when the kitchen has finished everything.
                    </p>
                  </div>
                </div>
              )}

              {!activeCustomer && (
                <button
                  type="button"
                  onClick={() => setCustomerDialogOpen(true)}
                  className={cn(
                    'w-full rounded-2xl border-2 border-dashed border-primary/35 bg-gradient-to-br from-primary/[0.06] to-muted/40',
                    'p-4 text-left transition-all hover:border-primary/55 hover:shadow-md hover:from-primary/[0.09] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">Select customer</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Required before sending this order to the kitchen.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-primary shrink-0 hidden sm:inline">Choose →</span>
                  </div>
                </button>
              )}

              {activeCustomer && (
                <Card className="border-primary/20 bg-primary/[0.03] shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-1 shrink-0 bg-primary" aria-hidden />
                      <div className="flex flex-1 items-start justify-between gap-2 p-3 min-w-0">
                        <div className="flex gap-3 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-primary/20">
                            {(activeCustomer.name || '?').trim().split(/\s+/).length > 1
                              ? `${(activeCustomer.name.trim().split(/\s+/)[0][0] || '').toUpperCase()}${(activeCustomer.name.trim().split(/\s+/).pop()[0] || '').toUpperCase()}`
                              : (activeCustomer.name || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 py-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold truncate">{activeCustomer.name}</p>
                              {activeCustomer.isSelfOrderGuest && (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  Mobile order
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {[activeCustomer.mobile || activeCustomer.phone, activeCustomer.email].filter(Boolean).join(' · ') || 'No contact on file'}
                            </p>
                          </div>
                        </div>
                        {!activeCustomer.isSelfOrderGuest && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs shrink-0 h-9 rounded-lg border-primary/25"
                            onClick={() => setCustomerDialogOpen(true)}
                          >
                            Change
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardHeader>

            <CardContent className="flex-1 overflow-auto px-3 sm:px-5 py-2 space-y-2 min-h-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground px-2">
                  <div className="rounded-full bg-muted p-4 mb-3">
                    <ShoppingCart className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Cart is empty</p>
                  <p className="text-xs mt-1 max-w-[200px]">Tap a product on the left to add it here.</p>
                </div>
              ) : (
                items.map((item) => (
                  <Card
                    key={item.cartLineId}
                    className={cn(
                      'overflow-hidden border-border/70 shadow-sm transition-shadow',
                      item.locked ? 'bg-muted/20' : 'bg-card'
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 rounded-xl bg-muted shrink-0 overflow-hidden flex items-center justify-center border border-border/60">
                          <img
                            src={lineItemImageSrc(item)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold leading-tight line-clamp-2">{item.name}</p>
                            {item.locked && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <Lock className="h-3 w-3" />
                                Sent
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(item.unitPrice)} each</p>
                          {item.kitchenStatus && item.kitchenStatus !== 'pending' && (
                            <p className="text-[10px] text-muted-foreground">
                              Kitchen: {getKitchenStageLabel(item.kitchenStatus)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {item.locked ? (
                            <>
                              <span className="text-sm font-bold tabular-nums">{item.quantity}×</span>
                              <span className="text-sm font-semibold tabular-nums text-primary">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.quantity <= 1) dispatch(removeItem(item));
                                    else dispatch(updateQuantity({ cartLineId: item.cartLineId, quantity: item.quantity - 1 }));
                                  }}
                                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-border bg-background hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                                >
                                  {item.quantity <= 1 ? (
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  ) : (
                                    <Minus className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <span className="text-sm font-bold w-7 text-center tabular-nums">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dispatch(updateQuantity({ cartLineId: item.cartLineId, quantity: item.quantity + 1 }));
                                  }}
                                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-border bg-background hover:bg-primary/10 hover:border-primary/30 transition-colors"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.subtotal)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>

            {items.length > 0 && (
              <div className="shrink-0 border-t border-border bg-muted/15 px-5 py-4 space-y-4">
                <Card className="border-primary/20 bg-primary/[0.04] shadow-none">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span className="tabular-nums font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <Separator className="my-1 bg-border/80" />
                    <div className="flex justify-between gap-4 text-base font-bold">
                      <span>Total</span>
                      <span className="text-primary tabular-nums">{formatCurrency(total)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full gap-2 h-12 text-base shadow-md" size="lg" onClick={handleSubmitOrder}>
                  <Send className="h-4 w-4" />
                  {activeOrder ? 'Save & send to kitchen' : 'Confirm & send to kitchen'}
                </Button>

                {unpaid && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full gap-2 h-12 text-base border border-border"
                    size="lg"
                    onClick={handlePayNow}
                    disabled={!canPayNow}
                    title={!canPayNow ? 'Every item must be completed in the kitchen before payment.' : undefined}
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay now · {formatCurrency(total)}
                  </Button>
                )}
              </div>
            )}
          </Card>
          </ScrollReveal>
        </aside>
      </div>

      <CustomerSelectDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        tableLabel={activeTable ? `Table ${activeTable.tableNumber}` : 'Table'}
      />
    </div>
  );
};

export default OrderScreen;
