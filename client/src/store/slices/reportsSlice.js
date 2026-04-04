import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportsApi from '../../api/reportsApi';

export const fetchDashboard = createAsyncThunk('reports/dashboard', async (_, { rejectWithValue }) => {
  try { const { data } = await reportsApi.getDashboard(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const fetchSalesReport = createAsyncThunk('reports/sales', async (params, { rejectWithValue }) => {
  try { const { data } = await reportsApi.getSales(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    dashboard: null, salesData: [], filters: { period: 'today' },
    isLoading: false, error: null,
  },
  reducers: {
    setFilters: (state, { payload }) => { state.filters = { ...state.filters, ...payload }; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.isLoading = true; })
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => { state.isLoading = false; state.dashboard = payload; })
      .addCase(fetchSalesReport.fulfilled, (state, { payload }) => { state.salesData = payload; });
  },
});

export const { setFilters } = reportsSlice.actions;
export default reportsSlice.reducer;
