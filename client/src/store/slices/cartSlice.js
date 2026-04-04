import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { activeTable: null, activeOrder: null, items: [], subtotal: 0, tax: 0, total: 0 },
  reducers: {
    setActiveTable: (state, { payload }) => { state.activeTable = payload; },
    setActiveOrder: (state, { payload }) => { state.activeOrder = payload; },
    addItem: (state, { payload }) => {
      const existing = state.items.find(
        (i) => i.productId === payload.productId && i.variant === (payload.variant || '')
      );
      if (existing) {
        existing.quantity += 1;
        existing.subtotal = existing.quantity * existing.unitPrice;
      } else {
        state.items.push({
          productId: payload.productId,
          name: payload.name,
          quantity: 1,
          unitPrice: payload.unitPrice,
          variant: payload.variant || '',
          subtotal: payload.unitPrice,
          image: payload.image || '',
        });
      }
      recalcTotals(state);
    },
    removeItem: (state, { payload }) => {
      state.items = state.items.filter(
        (i) => !(i.productId === payload.productId && i.variant === (payload.variant || ''))
      );
      recalcTotals(state);
    },
    updateQuantity: (state, { payload }) => {
      const item = state.items.find(
        (i) => i.productId === payload.productId && i.variant === (payload.variant || '')
      );
      if (item) {
        item.quantity = Math.max(1, payload.quantity);
        item.subtotal = item.quantity * item.unitPrice;
      }
      recalcTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.activeTable = null;
      state.activeOrder = null;
    },
    loadExistingOrder: (state, { payload }) => {
      state.activeOrder = payload._id;
      state.items = payload.items.map((item) => ({
        productId: item.product?._id || item.product,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variant: item.variant || '',
        subtotal: item.subtotal,
      }));
      recalcTotals(state);
    },
  },
});

function recalcTotals(state) {
  state.subtotal = state.items.reduce((sum, i) => sum + i.subtotal, 0);
  state.tax = parseFloat((state.subtotal * 0.05).toFixed(2));
  state.total = parseFloat((state.subtotal + state.tax).toFixed(2));
}

export const { setActiveTable, setActiveOrder, addItem, removeItem, updateQuantity, clearCart, loadExistingOrder } = cartSlice.actions;
export default cartSlice.reducer;
