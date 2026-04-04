import axiosClient from './axiosClient';

/**
 * A highly abstracted, universal API service layer.
 * This ensures that components and feature wrappers only ever 
 * need to pass the URL and Data, keeping them completely unaware 
 * of Axios under the hood.
 */
const apiService = {
  get: (url, config = {}) => axiosClient.get(url, config),
  post: (url, data, config = {}) => axiosClient.post(url, data, config),
  put: (url, data, config = {}) => axiosClient.put(url, data, config),
  patch: (url, data, config = {}) => axiosClient.patch(url, data, config),
  delete: (url, config = {}) => axiosClient.delete(url, config),
};

export default apiService;
