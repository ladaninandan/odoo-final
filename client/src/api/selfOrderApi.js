import api from './apiService';

const selfOrderApi = {
  generateToken: (data) => api.post('/self-order/generate-token', data),
  getMenu: (token) => api.get(`/self-order/menu?token=${token}`),
  getTableInfo: (token) => api.get(`/self-order/table?token=${token}`),
  placeOrder: (data) => api.post('/self-order/place-order', data),
  getOrderStatus: (token) => api.get(`/self-order/status?token=${token}`),
};

export default selfOrderApi;
