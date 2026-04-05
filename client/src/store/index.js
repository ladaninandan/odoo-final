import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import floorsReducer from './slices/floorsSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import paymentReducer from './slices/paymentSlice';
import kitchenReducer from './slices/kitchenSlice';
import sessionReducer from './slices/sessionSlice';
import reportsReducer from './slices/reportsSlice';
import customerDisplayReducer from './slices/customerDisplaySlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    floors: floorsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    payment: paymentReducer,
    kitchen: kitchenReducer,
    session: sessionReducer,
    reports: reportsReducer,
    customerDisplay: customerDisplayReducer,
    ui: uiReducer,
  },
});
