import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'https://g3-sports-backend.onrender.com') + '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('g3_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('g3_admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  },
);
