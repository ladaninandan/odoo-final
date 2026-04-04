import api from './apiService';

const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params) => api.get('/reports/sales', { params }),
  exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
  exportXLS: (params) => api.get('/reports/export/xls', { params, responseType: 'blob' }),
};

export default reportsApi;
