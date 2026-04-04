import api from './apiService';

const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (data) => api.post('/auth/google', data),
  logout: () => api.post('/auth/logout'),
  requestOtp: (data) => api.post('/auth/request-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export default authApi;
