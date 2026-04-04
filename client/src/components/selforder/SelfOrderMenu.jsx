import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import selfOrderApi from '../../api/selfOrderApi';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Search, Plus, Minus, ShoppingCart, Trash2, Send, Loader2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from '../ui/Toaster';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SelfOrderMenu = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await selfOrderApi.getMenu(token);
        setProducts(data.products);
        setCategories(data.categories);
        setTableNumber(data.tableNumber);
      } catch {
        setInvalidToken(true);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) => i.productId === product._id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
          : i
        );
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
        subtotal: product.price,
        image: product.image,
      }];
    });
  }, []);

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const newQty = Math.max(0, i.quantity + delta);
        if (newQty === 0) return null;
        return { ...i, quantity: newQty, subtotal: newQty * i.unitPrice };
      }).filter(Boolean)
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const cartTax = parseFloat((cartTotal * 0.05).toFixed(2));
  const cartGrandTotal = parseFloat((cartTotal + cartTax).toFixed(2));

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
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
      });
      toast.success('Order placed successfully! 🎉');
      setCart([]);
      setShowCart(false);
      navigate(`/order/${token}/status`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
    setPlacing(false);
  };

  if (invalidToken) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
        <p className="text-muted-foreground">Please ask staff for a new QR code.</p>
      </div>
    );
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCat || p.category?._id === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="pb-24">
      <Toaster />
      {/* Table badge */}
      <div className="px-4 py-2 text-center">
        <Badge variant="outline" className="text-sm">Table {tableNumber}</Badge>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu..." className="pl-9" />
          {search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}><X className="h-4 w-4" /></button>}
        </div>
      </div>

      {/* Category filter */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        <Button variant={!selectedCat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCat(null)}>All</Button>
        {categories.map((c) => (
          <Button key={c._id} variant={selectedCat === c._id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCat(c._id)} className="whitespace-nowrap">
            {c.icon} {c.name}
          </Button>
        ))}
      </div>

      {/* Products */}
      <div className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          filtered.map((p) => {
            const inCart = cart.find((i) => i.productId === p._id);
            return (
              <Card key={p._id} className={`flex overflow-hidden ${inCart ? 'ring-2 ring-primary' : ''}`}>
                {p.image && (
                  <div className="w-20 h-20 shrink-0 bg-muted">
                    <img src={`${API_URL}${p.image}`} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{p.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                    <p className="text-primary font-bold text-sm mt-0.5">{formatCurrency(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {inCart ? (
                      <>
                        <button onClick={() => updateQty(p._id, -1)} className="h-7 w-7 rounded-full border flex items-center justify-center">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{inCart.quantity}</span>
                        <button onClick={() => updateQty(p._id, 1)} className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center">
                          <Plus className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => addToCart(p)} className="h-8 w-8 rounded-full border-2 border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Cart floating bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="max-w-md mx-auto px-4 py-3">
            {showCart && (
              <div className="mb-3 space-y-2 max-h-48 overflow-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tax (5%)</span><span>{formatCurrency(cartTax)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button onClick={() => setShowCart(!showCart)} className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <span className="font-bold">{formatCurrency(cartGrandTotal)}</span>
                  <Badge variant="secondary" className="text-xs">{cart.reduce((s, i) => s + i.quantity, 0)} items</Badge>
                </div>
              </button>
              <Button onClick={handlePlaceOrder} disabled={placing} className="gap-2">
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Place Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfOrderMenu;
