import api from './apiService';

const selfOrderApi = {
  generateToken: (data) => api.post('/self-order/generate-token', data),
  getMenu: (token) =>
    api.get(`/self-order/menu?token=${encodeURIComponent(String(token).trim())}`),
  getTableInfo: (token) =>
    api.get(`/self-order/table?token=${encodeURIComponent(String(token).trim())}`),
  placeOrder: (data) => api.post('/self-order/place-order', data),
  getOrderStatus: (token) =>
    api.get(`/self-order/status?token=${encodeURIComponent(String(token).trim())}`),
};

export default selfOrderApi;
