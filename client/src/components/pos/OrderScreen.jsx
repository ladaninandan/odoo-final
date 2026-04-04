import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice';
import { addItem, removeItem, updateQuantity, clearCart, setActiveTable } from '../../store/slices/cartSlice';
import { createOrder, sendToKitchen } from '../../store/slices/ordersSlice';
import tablesApi from '../../api/tablesApi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Search, Plus, Minus, Trash2, Send, ArrowRight, ShoppingCart, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OrderScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { list: products, categories, isLoading } = useSelector((state) => state.products);
  const { items, subtotal, tax, total, activeTable } = useSelector((state) => state.cart);
  const { current: session } = useSelector((state) => state.session);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());

    const loadTable = async () => {
      try {
        const { data } = await tablesApi.getAll({ floor: '' });
        const table = data.find((t) => t._id === tableId);
        if (table) dispatch(setActiveTable(table));
      } catch {}
    };
    if (!activeTable || activeTable._id !== tableId) loadTable();
  }, [dispatch, tableId, activeTable]);

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
    }));
  }, [dispatch]);

  const handleCreateOrder = async () => {
    if (!items.length) return toast.error('Cart is empty');
    try {
      const orderData = {
        tableId,
        sessionId: session?._id,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          variant: i.variant,
        })),
      };
      const order = await dispatch(createOrder(orderData)).unwrap();
      toast.success(`Order ${order.orderNumber} created!`);

      // Auto-send to kitchen
      await dispatch(sendToKitchen(order._id)).unwrap();
      toast.success('Sent to kitchen!');
      navigate(`/pos/payment/${order._id}`);
    } catch (err) {
      toast.error(err || 'Failed to create order');
    }
  };

  return (
    <div className="h-full flex">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search + Categories */}
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
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
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

        {/* Products grid */}
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
                const inCart = items.find((i) => i.productId === product._id);
                return (
                  <Card
                    key={product._id}
                    onClick={() => handleAddItem(product)}
                    className={cn(
                      'cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.02] overflow-hidden group',
                      inCart && 'ring-2 ring-primary'
                    )}
                  >
                    {product.image && (
                      <div className="h-24 bg-muted overflow-hidden">
                        <img
                          src={`${API_URL}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-bold text-sm">{formatCurrency(product.price)}</span>
                        {inCart && (
                          <Badge variant="default" className="text-xs">
                            ×{inCart.quantity}
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

      {/* Right: Cart Panel */}
      <div className="w-80 border-l flex flex-col bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Order</h2>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => dispatch(clearCart())} className="text-destructive text-xs">
              Clear
            </Button>
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
            items.map((item, idx) => (
              <div key={`${item.productId}-${item.variant}`} className="flex items-start gap-3 animate-fade-in">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} ea</p>
                  {item.variant && <p className="text-xs text-primary">{item.variant}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.quantity <= 1) dispatch(removeItem(item));
                      else dispatch(updateQuantity({ ...item, quantity: item.quantity - 1 }));
                    }}
                    className="h-6 w-6 rounded flex items-center justify-center border hover:bg-destructive/10 transition-colors"
                  >
                    {item.quantity <= 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(updateQuantity({ ...item, quantity: item.quantity + 1 }));
                    }}
                    className="h-6 w-6 rounded flex items-center justify-center border hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-medium w-16 text-right">{formatCurrency(item.subtotal)}</span>
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

            <Button className="w-full gap-2" size="lg" onClick={handleCreateOrder}>
              <Send className="h-4 w-4" />
              Place Order & Send to Kitchen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderScreen;
