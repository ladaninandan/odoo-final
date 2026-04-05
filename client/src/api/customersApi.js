import api from './apiService';

const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.patch(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export default customersApi;
