import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import selfOrderApi from '../../api/selfOrderApi';
import { useSelfOrderCart } from '../../context/SelfOrderCartContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { getServerOrigin } from '../../utils/lanServerUrl';
import { ArrowLeft, Plus, Minus, Package } from 'lucide-react';

const API_URL = getServerOrigin();

const SelfOrderProductDetail = () => {
  const { token, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const menuQuery = searchParams.toString();
  const backPath = menuQuery ? `/order/${token}?${menuQuery}` : `/order/${token}`;

  const { addToCart, updateQty, cart, cartGrandTotal } = useSelfOrderCart();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);

  useEffect(() => {
    if (location.state?.product) {
      setProduct(location.state.product);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await selfOrderApi.getMenu(token);
        if (cancelled) return;
        const found = (data.products || []).find((p) => String(p._id) === String(productId));
        setProduct(found || null);
      } catch {
        setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, productId, location.state]);

  const inCart = useMemo(
    () => cart.find((i) => i.productId === product?._id),
    [cart, product]
  );

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">This item is not on the menu.</p>
        <Button variant="outline" onClick={() => navigate(backPath)}>Back to menu</Button>
      </div>
    );
  }

  return (
    <div className={cart.length > 0 ? 'pb-28' : 'pb-8'}>
      <div className="px-4 pt-2 pb-4">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4" />
          Menu
        </Button>

        <Card className="overflow-hidden border-0 shadow-lg sm:border sm:shadow-md">
          <div className="aspect-[4/3] sm:aspect-[16/9] max-h-[min(56vh,420px)] bg-muted w-full overflow-hidden flex items-center justify-center">
            {product.image ? (
              <img
                src={`${API_URL}${product.image}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-24 w-24 text-muted-foreground/40" strokeWidth={1} />
            )}
          </div>
          <div className="p-4 sm:p-6 space-y-3 text-left">
            {product.category && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: product.category.color || undefined,
                  color: product.category.color || undefined,
                }}
              >
                {product.category.icon} {product.category.name}
              </Badge>
            )}
            <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
            <p className="text-3xl font-bold text-primary tabular-nums">{formatCurrency(product.price)}</p>
            {product.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description</p>
            )}
            <div className="flex items-center justify-between gap-4 pt-2 border-t">
              <span className="text-sm font-medium">Add to order</span>
              <div className="flex items-center gap-2">
                {inCart ? (
                  <>
                    <button
                      type="button"
                      onClick={() => updateQty(product._id, -1)}
                      className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-semibold tabular-nums">{inCart.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(product._id, 1)}
                      className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <Button type="button" size="lg" className="gap-2" onClick={() => addToCart(product)}>
                    <Plus className="h-5 w-5" />
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[40] border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Cart</p>
              <p className="font-bold tabular-nums text-primary">{formatCurrency(cartGrandTotal)}</p>
            </div>
            <Button type="button" className="shrink-0" onClick={() => navigate(backPath)}>
              View cart &amp; checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfOrderProductDetail;
