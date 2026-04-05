import api from './apiService';

const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  // Let axios set multipart boundary; manual Content-Type breaks uploads and can confuse auth
  create: (formData) => api.post('/products', formData),
  update: (id, formData) => api.put(`/products/${id}`, formData),
  remove: (id) => api.delete(`/products/${id}`),
};

export default productsApi;
