import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import selfOrderApi from '../../api/selfOrderApi';
import { useSelfOrderCart } from '../../context/SelfOrderCartContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/Dialog';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Search, Plus, Minus, ShoppingCart, Send, Loader2, X, User, Phone, MessageSquare, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getServerOrigin } from '../../utils/lanServerUrl';

const API_URL = getServerOrigin();

/** Order still in progress — resume / merge allowed */
const ACTIVE_SELF_ORDER_STATUSES = ['draft', 'sent_to_kitchen', 'ready'];

function orderToPreview(ord, tableNum) {
  return {
    orderNumber: ord.orderNumber,
    status: ord.status,
    items: ord.items,
    subtotal: ord.subtotal,
    tax: ord.tax,
    total: ord.total,
    guestName: ord.guestName || '',
    guestPhone: ord.guestPhone || '',
    notes: ord.notes || '',
    tableNumber: ord.tableNumber ?? tableNum,
    createdAt: ord.createdAt || new Date().toISOString(),
    orderId: ord.orderId,
  };
}

const SelfOrderMenu = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const menuMode = searchParams.get('menu') === '1';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const {
    cart,
    addToCart,
    updateQty,
    clearCart,
    cartTotal,
    cartTax,
    cartGrandTotal,
  } = useSelfOrderCart();
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [hasOpenOrder, setHasOpenOrder] = useState(false);
  const [openOrderNumber, setOpenOrderNumber] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadError(null);
      try {
        const { data } = await selfOrderApi.getMenu(token);
        setProducts(data.products);
        setCategories(data.categories);
        setTableNumber(data.tableNumber);

        try {
          const { data: ord } = await selfOrderApi.getOrderStatus(token);
          if (menuMode) {
            if (ACTIVE_SELF_ORDER_STATUSES.includes(ord.status)) {
              setGuestName(ord.guestName || '');
              setGuestPhone(ord.guestPhone || '');
              setOrderNotes('');
              setHasOpenOrder(true);
              setOpenOrderNumber(ord.orderNumber || '');
            }
          } else if (ACTIVE_SELF_ORDER_STATUSES.includes(ord.status)) {
            navigate(`/order/${token}/status`, {
              replace: true,
              state: { orderPreview: orderToPreview(ord, data.tableNumber) },
            });
            return;
          }
        } catch {
          /* 404 — no order yet */
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) {
          setLoadError('auth');
        } else {
          setLoadError('network');
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('[SelfOrder] menu load failed', status, err.message);
        }
      }
      setLoading(false);
    };
    if (token) load();
    else {
      setLoadError('auth');
      setLoading(false);
    }
  }, [token, menuMode, navigate]);

  const goToProductDetail = (p) => {
    const q = searchParams.toString();
    navigate(`/order/${token}/product/${p._id}${q ? `?${q}` : ''}`, { state: { product: p } });
  };

  const openCheckout = () => {
    if (!cart.length) return;
    setCheckoutOpen(true);
  };

  const validateGuest = () => {
    const name = guestName.trim();
    const phone = guestPhone.trim();
    const digits = phone.replace(/\D/g, '');
    if (name.length < 2) {
      toast.error('Please enter your name (at least 2 characters).');
      return false;
    }
    if (digits.length < 10) {
      toast.error('Please enter a valid mobile number (at least 10 digits).');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    if (!hasOpenOrder && !validateGuest()) return;
    setPlacing(true);
    try {
      const { data } = await selfOrderApi.placeOrder({
        token,
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        notes: orderNotes.trim(),
      });
      const o = data.order;
      const preview = orderToPreview(
        {
          orderNumber: o.orderNumber,
          status: o.status,
          items: o.items,
          subtotal: o.subtotal,
          tax: o.tax,
          total: o.total,
          guestName: o.guestName || guestName.trim(),
          guestPhone: o.guestPhone || guestPhone.trim(),
          notes: o.notes || orderNotes.trim(),
          createdAt: o.createdAt || new Date().toISOString(),
          orderId: o._id || o.orderId,
        },
        tableNumber
      );
      clearCart();
      setShowCart(false);
      setCheckoutOpen(false);
      toast.success(data.merged ? `Added to order ${o.orderNumber}` : `Order ${o.orderNumber} placed!`);
      navigate(`/order/${token}/status`, { state: { orderPreview: preview } });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to place order';
      toast.error(msg);
    }
    setPlacing(false);
  };

  if (loadError) {
    const isNetwork = loadError === 'network';
    return (
      <div className="mx-auto max-w-md p-8 text-center space-y-3">
        <h2 className="text-xl font-bold">
          {isNetwork ? 'Cannot reach restaurant server' : 'Invalid or expired link'}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {isNetwork ? (
            <>
              Your phone could not load the menu from the ordering server. Open this page using your PC&apos;s
              LAN address (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">http://192.168.x.x:3000</code>)
              with <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run start:lan</code>, then scan a new QR.
              Ensure port 5000 is allowed on the firewall.
            </>
          ) : (
            <>This table link is no longer valid. Ask staff to open a session and generate a new QR from the floor plan.</>
          )}
        </p>
      </div>
    );
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || p.category?._id === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="pb-28">
      <div className="px-4 py-2 text-center space-y-2">
        <Badge variant="outline" className="text-sm">Table {tableNumber}</Badge>
        {hasOpenOrder && menuMode && openOrderNumber && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-left text-sm">
            <p className="font-medium text-primary">Adding to order #{openOrderNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your name and mobile stay the same. New items are added to this order.
            </p>
          </div>
        )}
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." className="pl-9" />
          {search && (
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        <Button variant={!selectedCat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCat(null)}>All</Button>
        {categories.map((c) => (
          <Button key={c._id} variant={selectedCat === c._id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCat(c._id)} className="whitespace-nowrap">
            {c.icon} {c.name}
          </Button>
        ))}
      </div>

      <div className="px-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : (
          filtered.map((p) => {
            const inCart = cart.find((i) => i.productId === p._id);
            return (
              <Card
                key={p._id}
                className={`flex flex-col overflow-hidden h-full ${inCart ? 'ring-2 ring-primary' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => goToProductDetail(p)}
                  className="text-left flex flex-col flex-1 min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-t-lg"
                >
                  <div className="aspect-[4/3] sm:aspect-[16/10] w-full bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image ? (
                      <img src={`${API_URL}${p.image}`} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground/35" strokeWidth={1} />
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2">{p.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">{p.description || ' '}</p>
                    <p className="text-primary font-bold text-sm mt-2 tabular-nums">{formatCurrency(p.price)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Open for full details</p>
                  </div>
                </button>
                <div className="p-3 pt-0 flex justify-end items-center border-t border-border/60">
                  <div className="flex items-center gap-1">
                    {inCart ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateQty(p._id, -1); }}
                          className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center font-semibold text-sm tabular-nums">{inCart.quantity}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateQty(p._id, 1); }}
                          className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="h-9 px-4 rounded-full border-2 border-primary text-primary text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[40] border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-md mx-auto px-4 py-3 pb-4">
            {showCart && (
              <div className="mb-3 space-y-2 max-h-40 overflow-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center border border-border/50">
                        {item.image ? (
                          <img src={`${API_URL}${item.image}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/40" strokeWidth={1.5} />
                        )}
                      </div>
                      <span className="truncate">{item.name} × {item.quantity}</span>
                    </div>
                    <span className="font-medium tabular-nums shrink-0">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tax (5%)</span>
                  <span className="tabular-nums">{formatCurrency(cartTax)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowCart(!showCart)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-bold tabular-nums">{formatCurrency(cartGrandTotal)}</span>
                  <Badge variant="secondary" className="text-xs">{cart.reduce((s, i) => s + i.quantity, 0)} items</Badge>
                </div>
              </button>
              <Button type="button" onClick={openCheckout} className="gap-2 shrink-0">
                <Send className="h-4 w-4" />
                Review &amp; order
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hasOpenOrder ? 'Add to your order' : 'Confirm your order'}</DialogTitle>
            <p className="text-sm text-muted-foreground text-left font-normal">
              {hasOpenOrder
                ? `Table ${tableNumber} · Items are added to order #${openOrderNumber} and sent to the kitchen.`
                : `Table ${tableNumber} · Your order goes straight to the kitchen. Name and mobile are required.`}
            </p>
          </DialogHeader>

          <div className="space-y-3 text-left">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between gap-2 items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img src={`${API_URL}${item.image}`} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                    <span className="truncate">{item.name} × {item.quantity}</span>
                  </div>
                  <span className="tabular-nums text-muted-foreground shrink-0">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax (5%)</span>
                <span className="tabular-nums">{formatCurrency(cartTax)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary tabular-nums">{formatCurrency(cartGrandTotal)}</span>
              </div>
            </div>

            {!hasOpenOrder ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guestName" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Your name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Alex"
                    autoComplete="name"
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone" className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> Mobile <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    inputMode="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="10+ digit mobile number"
                    autoComplete="tel"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="rounded-lg border bg-muted/40 px-3 py-2.5 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your details</p>
                <p className="flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 shrink-0" />
                  {guestName || '—'}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground tabular-nums">
                  <Phone className="h-4 w-4 shrink-0" />
                  {guestPhone || '—'}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="orderNotes" className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" /> Special requests <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="orderNotes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Allergies, spice level, etc."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)} disabled={placing}>
              Back
            </Button>
            <Button type="button" onClick={handlePlaceOrder} disabled={placing} className="gap-2 w-full sm:w-auto">
              {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {hasOpenOrder ? 'Add to order' : 'Place order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelfOrderMenu;
