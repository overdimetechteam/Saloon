import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login/')) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access', data.access);
          if (data.refresh) localStorage.setItem('refresh', data.refresh);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export function uploadProfilePhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  return api.patch('/employee/profile/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export default api;
