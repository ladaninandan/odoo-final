import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import kitchenApi from '../../api/kitchenApi';

export const fetchKitchenOrders = createAsyncThunk('kitchen/fetchOrders', async (_, { rejectWithValue }) => {
  try { const { data } = await kitchenApi.getActiveOrders(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch kitchen orders'); }
});

export const advanceStage = createAsyncThunk('kitchen/advanceStage', async (id, { rejectWithValue }) => {
  try { const { data } = await kitchenApi.advanceStage(id); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to advance stage'); }
});

/** Mark one line item as kitchen-completed; refreshes queue from server */
export const markKitchenItemPrepared = createAsyncThunk(
  'kitchen/markKitchenItemDone',
  async (itemId, { dispatch, rejectWithValue }) => {
    try {
      await kitchenApi.markItemPrepared(itemId);
      await dispatch(fetchKitchenOrders());
      return itemId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark item');
    }
  }
);

const kitchenSlice = createSlice({
  name: 'kitchen',
  initialState: {
    orders: { to_cook: [], preparing: [], completed: [] },
    isConnected: false, isLoading: false,
  },
  reducers: {
    setConnected: (state, { payload }) => { state.isConnected = payload; },
    addOrder: (state, { payload }) => {
      if (!payload?._id) return;
      const id = String(payload._id);
      const cols = ['to_cook', 'preparing', 'completed'];
      for (const col of cols) {
        if (state.orders[col]?.some((o) => String(o._id) === id)) return;
      }
      state.orders.to_cook.push(payload);
    },
    updateStage: (state, { payload }) => {
      const { orderId, stage } = payload;
      // Remove from all columns
      ['to_cook', 'preparing', 'completed'].forEach((col) => {
        state.orders[col] = state.orders[col].filter((o) => o._id !== orderId);
      });
      // Find order and re-add to correct column
      // The order data should already be in the state somewhere
    },
    markItemPrepared: (state, { payload }) => {
      const { orderId, itemId } = payload;
      ['to_cook', 'preparing', 'completed'].forEach((col) => {
        const order = state.orders[col].find((o) => o._id === orderId);
        if (order) {
          const item = order.items?.find((i) => i._id === itemId);
          if (item) item.kitchenStatus = 'completed';
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKitchenOrders.pending, (state) => { state.isLoading = true; })
      .addCase(fetchKitchenOrders.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.orders = payload;
      })
      .addCase(fetchKitchenOrders.rejected, (state) => { state.isLoading = false; })
      .addCase(advanceStage.fulfilled, (state, { payload }) => {
        // Re-fetch is cleaner; dispatch fetchKitchenOrders after this
      });
  },
});

export const { setConnected, addOrder, updateStage, markItemPrepared } = kitchenSlice.actions;
export default kitchenSlice.reducer;
