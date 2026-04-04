import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice';
import {
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
import { Card } from '../ui/Card';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Search, Plus, Minus, Trash2, Send, ShoppingCart, X, User, CreditCard, AlertCircle, Lock, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getServerOrigin } from '../../utils/lanServerUrl';

const API_URL = getServerOrigin();

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [resumeReady, setResumeReady] = useState(false);

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

  useEffect(() => {
    if (!tableId || !resumeReady) return;
    if (!activeCustomer?._id) {
      navigate(`/pos/table/${tableId}/customer`, { replace: true });
    }
  }, [tableId, activeCustomer, navigate, resumeReady]);

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
      navigate(`/pos/table/${tableId}/customer`);
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

  const isResume = Boolean(activeOrder);
  const unpaid = isResume;

  if (!resumeReady) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={!selectedCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat._id}
                variant={selectedCategory === cat._id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat._id)}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
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
                  <Card
                    key={product._id}
                    onClick={() => handleAddItem(product)}
                    className={cn(
                      'cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.02] overflow-hidden group',
                      highlightNew && 'ring-2 ring-primary',
                      highlightSentOnly && 'ring-2 ring-muted-foreground/35'
                    )}
                  >
                    <div className="h-28 bg-muted overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={`${API_URL}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground/35" strokeWidth={1} />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-bold text-sm">{formatCurrency(product.price)}</span>
                        {unlockedQty > 0 && (
                          <Badge variant="default" className="text-xs">
                            ×{unlockedQty}
                          </Badge>
                        )}
                        {unlockedQty === 0 && lockedQty > 0 && (
                          <Badge variant="secondary" className="text-xs gap-0.5">
                            <Lock className="h-3 w-3" />
                            {lockedQty}
                          </Badge>
                        )}
                      </div>
                      {product.category && (
                        <span
                          className="inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: product.category.color + '20', color: product.category.color }}
                        >
                          {product.category.icon} {product.category.name}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          {!isLoading && !filteredProducts.length && (
            <div className="text-center text-muted-foreground py-12">
              No products found
            </div>
          )}
        </div>
      </div>

      <div className="w-80 border-l flex flex-col bg-card">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Order</h2>
            </div>
            {items.length > 0 && !activeOrder && (
              <Button variant="ghost" size="sm" onClick={() => dispatch(clearLineItems())} className="text-destructive text-xs">
                Clear cart
              </Button>
            )}
          </div>

          {unpaid && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 flex gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Payment pending</p>
                <p className="text-xs text-muted-foreground">Add more items below, then pay when guests are done.</p>
              </div>
            </div>
          )}

          {activeCustomer && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 flex items-start justify-between gap-2">
              <div className="flex gap-2 min-w-0">
                <User className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{activeCustomer.name}</p>
                    {activeCustomer.isSelfOrderGuest && (
                      <Badge variant="secondary" className="text-[10px] font-normal">Mobile order</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {[activeCustomer.mobile || activeCustomer.phone, activeCustomer.email].filter(Boolean).join(' · ') || 'No contact'}
                  </p>
                </div>
              </div>
              {!activeCustomer.isSelfOrderGuest && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs shrink-0 h-auto p-0"
                  onClick={() => navigate(`/pos/table/${tableId}/customer`)}
                >
                  Change
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Tap a product to add</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartLineId} className="flex items-start gap-3 animate-fade-in">
                <div className="h-12 w-12 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center border border-border/50">
                  {item.image ? (
                    <img
                      src={`${API_URL}${item.image}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground/40" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.locked && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground shrink-0">
                        <Lock className="h-3 w-3" />
                        Sent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} ea</p>
                  {item.kitchenStatus && item.kitchenStatus !== 'pending' && (
                    <p className="text-[10px] text-muted-foreground capitalize">Kitchen: {item.kitchenStatus.replace('_', ' ')}</p>
                  )}
                </div>
                {item.locked ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-8 text-center tabular-nums">{item.quantity}</span>
                    <span className="text-sm font-medium w-16 text-right tabular-nums">{formatCurrency(item.subtotal)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.quantity <= 1) dispatch(removeItem(item));
                          else dispatch(updateQuantity({ cartLineId: item.cartLineId, quantity: item.quantity - 1 }));
                        }}
                        className="h-6 w-6 rounded flex items-center justify-center border hover:bg-destructive/10 transition-colors"
                      >
                        {item.quantity <= 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(updateQuantity({ cartLineId: item.cartLineId, quantity: item.quantity + 1 }));
                        }}
                        className="h-6 w-6 rounded flex items-center justify-center border hover:bg-primary/10 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{formatCurrency(item.subtotal)}</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleSubmitOrder}>
              <Send className="h-4 w-4" />
              {activeOrder ? 'Save changes & send to kitchen' : 'Confirm order & send to kitchen'}
            </Button>

            {unpaid && (
              <Button type="button" variant="secondary" className="w-full gap-2" size="lg" onClick={handlePayNow}>
                <CreditCard className="h-4 w-4" />
                Pay now ({formatCurrency(total)})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderScreen;
