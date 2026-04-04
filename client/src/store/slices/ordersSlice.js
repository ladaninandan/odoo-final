import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ordersApi from '../../api/ordersApi';

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await ordersApi.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders'); }
});

export const createOrder = createAsyncThunk('orders/create', async (orderData, { rejectWithValue }) => {
  try {
    const { data } = await ordersApi.create(orderData);
    return data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Failed to create order';
    return rejectWithValue(msg);
  }
});

export const sendToKitchen = createAsyncThunk('orders/sendToKitchen', async (id, { rejectWithValue }) => {
  try { const { data } = await ordersApi.sendToKitchen(id); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to send to kitchen'); }
});

export const updateOrder = createAsyncThunk('orders/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const { data: res } = await ordersApi.update(id, data);
    return res;
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update order';
    return rejectWithValue(msg);
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { list: [], currentOrder: null, isLoading: false, error: null },
  reducers: {
    setCurrentOrder: (state, { payload }) => { state.currentOrder = payload; },
    updateOrderStatus: (state, { payload }) => {
      const { orderId, status } = payload;
      const order = state.list.find((o) => o._id === orderId);
      if (order) order.status = status;
      if (state.currentOrder?._id === orderId) state.currentOrder.status = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.isLoading = true; })
      .addCase(fetchOrders.fulfilled, (state, { payload }) => { state.isLoading = false; state.list = payload; })
      .addCase(fetchOrders.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; })
      .addCase(createOrder.fulfilled, (state, { payload }) => { state.list.unshift(payload); state.currentOrder = payload; })
      .addCase(sendToKitchen.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((o) => o._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
        state.currentOrder = payload;
      })
      .addCase(updateOrder.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((o) => o._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
        if (state.currentOrder?._id === payload._id) state.currentOrder = payload;
      });
  },
});

export const { setCurrentOrder, updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
