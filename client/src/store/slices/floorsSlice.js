import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import floorsApi from '../../api/floorsApi';

export const fetchFloors = createAsyncThunk('floors/fetchAll', async (_, { rejectWithValue }) => {
  try { const { data } = await floorsApi.getAll(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch floors'); }
});

const floorsSlice = createSlice({
  name: 'floors',
  initialState: { list: [], selectedFloor: null, isLoading: false, error: null },
  reducers: {
    selectFloor: (state, { payload }) => { state.selectedFloor = payload; },
    updateTableStatus: (state, { payload }) => {
      const { tableId, status } = payload;
      const id = tableId != null ? String(tableId) : '';
      state.list.forEach((floor) => {
        const table = floor.tables?.find((t) => String(t._id) === id);
        if (table) table.status = status;
        if (status === 'available' && table) {
          table.currentOrder = null;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFloors.pending, (state) => { state.isLoading = true; })
      .addCase(fetchFloors.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.list = payload;
        if (!state.selectedFloor && payload.length > 0) state.selectedFloor = payload[0]._id;
      })
      .addCase(fetchFloors.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { selectFloor, updateTableStatus } = floorsSlice.actions;
export default floorsSlice.reducer;
