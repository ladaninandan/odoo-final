import { createSlice, nanoid } from '@reduxjs/toolkit';

function newCartLineId() {
  return `new-${nanoid(10)}`;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    activeTable: null,
    activeCustomer: null,
    activeOrder: null,
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
  },
  reducers: {
    setActiveTable: (state, { payload }) => { state.activeTable = payload; },
    setActiveCustomer: (state, { payload }) => { state.activeCustomer = payload; },
    setActiveOrder: (state, { payload }) => { state.activeOrder = payload; },
    addItem: (state, { payload }) => {
      const variant = payload.variant || '';
      const existingUnlocked = state.items.find(
        (i) =>
          !i.locked &&
          i.productId === payload.productId &&
          (i.variant || '') === variant
      );
      if (existingUnlocked) {
        existingUnlocked.quantity += 1;
        existingUnlocked.subtotal = existingUnlocked.quantity * existingUnlocked.unitPrice;
      } else {
        state.items.push({
          cartLineId: newCartLineId(),
          locked: false,
          productId: payload.productId,
          name: payload.name,
          quantity: 1,
          unitPrice: payload.unitPrice,
          variant,
          subtotal: payload.unitPrice,
          image: payload.image || '',
          kitchenStatus: payload.kitchenStatus || 'pending',
        });
      }
      recalcTotals(state);
    },
    removeItem: (state, { payload }) => {
      if (payload.locked) return;
      const id = payload.cartLineId;
      if (id) {
        state.items = state.items.filter((i) => i.cartLineId !== id);
      }
      recalcTotals(state);
    },
    updateQuantity: (state, { payload }) => {
      const item = state.items.find((i) => i.cartLineId === payload.cartLineId);
      if (!item || item.locked) return;
      item.quantity = Math.max(1, payload.quantity);
      item.subtotal = item.quantity * item.unitPrice;
      recalcTotals(state);
    },
    clearLineItems: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.activeOrder = null;
    },
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.activeTable = null;
      state.activeCustomer = null;
      state.activeOrder = null;
    },
    loadExistingOrder: (state, { payload }) => {
      state.activeOrder = payload._id;
      state.items = payload.items.map((item) => ({
        cartLineId: String(item._id),
        locked: true,
        productId: item.product?._id || item.product,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variant: item.variant || '',
        subtotal: item.subtotal,
        image: item.product?.image || '',
        kitchenStatus: item.kitchenStatus || 'pending',
      }));
      recalcTotals(state);
    },
    /** Replace locked lines from server; keep unlocked draft lines — used by POS order poll */
    mergeServerOrderIntoCart: (state, { payload }) => {
      state.activeOrder = payload._id;
      const serverLines = (payload.items || []).map((item) => ({
        cartLineId: String(item._id),
        locked: true,
        productId: item.product?._id || item.product,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variant: item.variant || '',
        subtotal: item.subtotal,
        image: item.product?.image || '',
        kitchenStatus: item.kitchenStatus || 'pending',
      }));
      const draftLines = state.items.filter((i) => !i.locked);
      state.items = [...serverLines, ...draftLines];
      recalcTotals(state);
    },
  },
});

function recalcTotals(state) {
  state.subtotal = state.items.reduce((sum, i) => sum + i.subtotal, 0);
  state.tax = parseFloat((state.subtotal * 0.05).toFixed(2));
  state.total = parseFloat((state.subtotal + state.tax).toFixed(2));
}

export const {
  setActiveTable,
  setActiveCustomer,
  setActiveOrder,
  addItem,
  removeItem,
  updateQuantity,
  clearLineItems,
  clearCart,
  loadExistingOrder,
  mergeServerOrderIntoCart,
} = cartSlice.actions;
export default cartSlice.reducer;
export { cartSlice };
