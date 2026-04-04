import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productsApi from '../../api/productsApi';
import categoriesApi from '../../api/categoriesApi';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await productsApi.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch products'); }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try { const { data } = await categoriesApi.getAll(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories'); }
});

export const createProduct = createAsyncThunk('products/create', async (formData, { rejectWithValue }) => {
  try { const { data } = await productsApi.create(formData); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create product'); }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, formData }, { rejectWithValue }) => {
  try { const { data } = await productsApi.update(id, formData); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update product'); }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try { await productsApi.remove(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete product'); }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: { list: [], categories: [], isLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => { state.isLoading = false; state.list = payload; })
      .addCase(fetchProducts.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => { state.categories = payload; })
      .addCase(createProduct.fulfilled, (state, { payload }) => { state.list.push(payload); })
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((p) => p._id === payload._id);
        if (idx !== -1) state.list[idx] = payload;
      })
      .addCase(deleteProduct.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((p) => p._id !== payload);
      });
  },
});

export default productsSlice.reducer;
