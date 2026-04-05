import api from './apiService';

const tablesApi = {
  getAll: (params) => api.get('/tables', { params }),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  remove: (id) => api.delete(`/tables/${id}`),
};

export default tablesApi;
