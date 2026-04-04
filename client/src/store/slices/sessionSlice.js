import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sessionsApi from '../../api/sessionsApi';

export const fetchCurrentSession = createAsyncThunk('session/fetchCurrent', async (_, { rejectWithValue }) => {
  try { const { data } = await sessionsApi.getCurrent(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const openSession = createAsyncThunk('session/open', async (data, { rejectWithValue }) => {
  try { const res = await sessionsApi.open(data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to open'); }
});

export const closeSession = createAsyncThunk('session/close', async ({ id, closingBalance }, { rejectWithValue }) => {
  try { const res = await sessionsApi.close(id, { closingBalance }); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to close'); }
});

const sessionSlice = createSlice({
  name: 'session',
  initialState: { current: null, isLoading: false, error: null },
  reducers: {
    sessionClosed: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentSession.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCurrentSession.fulfilled, (state, { payload }) => { state.isLoading = false; state.current = payload; })
      .addCase(fetchCurrentSession.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; })
      .addCase(openSession.fulfilled, (state, { payload }) => { state.current = payload; })
      .addCase(closeSession.fulfilled, (state) => { state.current = null; });
  },
});

export const { sessionClosed } = sessionSlice.actions;
export default sessionSlice.reducer;
