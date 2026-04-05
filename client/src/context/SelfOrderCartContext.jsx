import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SelfOrderCartContext = createContext(null);

export function SelfOrderCartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) => (i.productId === product._id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
          : i
        ));
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
        subtotal: product.price,
        image: product.image || '',
      }];
    });
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const newQty = Math.max(0, i.quantity + delta);
        if (newQty === 0) return null;
        return { ...i, quantity: newQty, subtotal: newQty * i.unitPrice };
      }).filter(Boolean)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.subtotal, 0),
    [cart]
  );
  const cartTax = useMemo(
    () => parseFloat((cartTotal * 0.05).toFixed(2)),
    [cartTotal]
  );
  const cartGrandTotal = useMemo(
    () => parseFloat((cartTotal + cartTax).toFixed(2)),
    [cartTotal, cartTax]
  );

  const value = useMemo(
    () => ({
      cart,
      setCart,
      addToCart,
      updateQty,
      clearCart,
      cartTotal,
      cartTax,
      cartGrandTotal,
    }),
    [cart, addToCart, updateQty, clearCart, cartTotal, cartTax, cartGrandTotal]
  );

  return (
    <SelfOrderCartContext.Provider value={value}>
      {children}
    </SelfOrderCartContext.Provider>
  );
}

export function useSelfOrderCart() {
  const ctx = useContext(SelfOrderCartContext);
  if (!ctx) {
    throw new Error('useSelfOrderCart must be used within SelfOrderCartProvider');
  }
  return ctx;
}
