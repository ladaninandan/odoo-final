import api from './apiService';

const usersApi = {
  getAll: () => api.get('/users'),
  update: (id, body) => api.patch(`/users/${id}`, body),
};

export default usersApi;
