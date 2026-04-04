import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentsApi from '../../api/paymentsApi';

export const initiatePayment = createAsyncThunk('payment/initiate', async (data, { rejectWithValue }) => {
  try { const res = await paymentsApi.initiate(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Payment failed'); }
});

export const confirmPayment = createAsyncThunk('payment/confirm', async (id, { rejectWithValue }) => {
  try { const res = await paymentsApi.confirm(id); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Confirmation failed'); }
});

export const fetchPaymentMethods = createAsyncThunk('payment/fetchMethods', async (_, { rejectWithValue }) => {
  try { const res = await paymentsApi.getMethods(); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch methods'); }
});

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    activePayment: null, selectedMethod: null, qrCode: null,
    status: 'idle', enabledMethods: [], error: null,
  },
  reducers: {
    selectMethod: (state, { payload }) => { state.selectedMethod = payload; },
    resetPayment: (state) => {
      state.activePayment = null; state.selectedMethod = null;
      state.qrCode = null; state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiatePayment.pending, (state) => { state.status = 'pending'; })
      .addCase(initiatePayment.fulfilled, (state, { payload }) => {
        state.activePayment = payload;
        state.qrCode = payload.qrCode || null;
        state.status = 'pending';
      })
      .addCase(confirmPayment.fulfilled, (state) => { state.status = 'confirmed'; })
      .addCase(confirmPayment.rejected, (state) => { state.status = 'failed'; })
      .addCase(fetchPaymentMethods.fulfilled, (state, { payload }) => { state.enabledMethods = payload; });
  },
});

export const { selectMethod, resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
