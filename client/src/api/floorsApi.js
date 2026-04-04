import api from './apiService';

const floorsApi = {
  getAll: () => api.get('/floors'),
  create: (data) => api.post('/floors', data),
  update: (id, data) => api.put(`/floors/${id}`, data),
  remove: (id) => api.delete(`/floors/${id}`),
};

export default floorsApi;
