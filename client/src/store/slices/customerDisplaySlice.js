import { createSlice } from '@reduxjs/toolkit';

const customerDisplaySlice = createSlice({
  name: 'customerDisplay',
  initialState: { currentOrder: null, paymentStatus: null },
  reducers: {
    setCurrentOrder: (state, { payload }) => { state.currentOrder = payload; },
    updateStatus: (state, { payload }) => {
      if (state.currentOrder) state.currentOrder.status = payload;
    },
    setPaymentStatus: (state, { payload }) => { state.paymentStatus = payload; },
    reset: (state) => { state.currentOrder = null; state.paymentStatus = null; },
  },
});

export const { setCurrentOrder, updateStatus, setPaymentStatus, reset } = customerDisplaySlice.actions;
export default customerDisplaySlice.reducer;
