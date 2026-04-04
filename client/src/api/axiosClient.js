import axios from 'axios';
import { getApiBaseUrl } from '../utils/lanServerUrl';

const API_BASE = getApiBaseUrl();

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // refresh token cookie for /auth/refresh
});

/** Dedupe concurrent refresh calls */
let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        refreshPromise = null;
        return res.data.accessToken;
      })
      .catch((err) => {
        refreshPromise = null;
        throw err;
      });
  }
  return refreshPromise;
};

const syncReduxToken = async (newToken) => {
  try {
    const { store } = await import('../store');
    const { loginSuccess } = await import('../store/slices/authSlice');
    const raw = localStorage.getItem('user');
    if (raw) {
      store.dispatch(loginSuccess({ user: JSON.parse(raw), accessToken: newToken }));
    }
  } catch {
    // store not available — localStorage still holds token for subsequent requests
  }
};

const shouldSkipAuthRetry = (config) => {
  const url = config?.url || '';
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/google') ||
    url.includes('/auth/refresh')
  );
};

// Attach JWT for protected routes
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: refresh access token once, then retry (access JWT is short-lived)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry || shouldSkipAuthRetry(originalRequest)) {
      console.error('API Error:', error.response?.data?.message || error.message);
      return Promise.reject(error);
    }

    if (!localStorage.getItem('token')) {
      console.error('API Error:', error.response?.data?.message || error.message);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      localStorage.setItem('token', newToken);
      await syncReduxToken(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(originalRequest);
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      try {
        const { store } = await import('../store');
        const { logoutSuccess } = await import('../store/slices/authSlice');
        store.dispatch(logoutSuccess());
      } catch {
        /* ignore */
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(e);
    }
  }
);

export default axiosClient;
