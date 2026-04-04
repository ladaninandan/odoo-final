import api from './apiService';

const sessionsApi = {
  getAll: () => api.get('/sessions'),
  getCurrent: () => api.get('/sessions/current'),
  open: (data) => api.post('/sessions/open', data),
  close: (id, data) => api.patch(`/sessions/${id}/close`, data),
};

export default sessionsApi;
