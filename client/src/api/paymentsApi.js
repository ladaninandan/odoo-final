import api from './apiService';

const paymentsApi = {
  initiate: (data) => api.post('/payments', data),
  confirm: (id) => api.patch(`/payments/${id}/confirm`),
  getUPIQR: (orderId) => api.get(`/payments/upi-qr/${orderId}`),
  getMethods: () => api.get('/payments/methods'),
  updateMethods: (methods) => api.put('/payments/methods', { methods }),
};

export default paymentsApi;
