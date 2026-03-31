import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: `${BASE_URL}/api` });

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sd_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sd_token');
      localStorage.removeItem('sd_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── helpers ──────────────────────────────────────────────────────────────────
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  onboarding: ()   => api.post('/auth/onboarding'),
};

export const screens = {
  list:   ()     => api.get('/screens'),
  get:    (id)   => api.get(`/screens/${id}`),
  create: (data) => api.post('/screens', data),
  update: (id, data) => api.put(`/screens/${id}`, data),
  delete: (id)   => api.delete(`/screens/${id}`),
  assign: (id, data) => api.post(`/screens/${id}/assign`, data),
  zone:   (id)   => api.get(`/screens/${id}/zone`),
};

export const content = {
  list:   ()     => api.get('/content'),
  create: (data) => api.post('/content', data),
  upload: (form, onProgress) => api.post('/content/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round(e.loaded * 100 / e.total)),
  }),
  rename: (id, title) => api.patch(`/content/${id}/title`, { title }),
  delete: (id)   => api.delete(`/content/${id}`),
};

export const playlists = {
  list:   ()     => api.get('/playlists'),
  get:    (id)   => api.get(`/playlists/${id}`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id)   => api.delete(`/playlists/${id}`),
};

export const locations = {
  list:   ()     => api.get('/locations'),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id)   => api.delete(`/locations/${id}`),
};

export const brands = {
  list:   ()     => api.get('/brands'),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id)   => api.delete(`/brands/${id}`),
};

export const billing = {
  get:      ()     => api.get('/billing'),
  activate: (data) => api.post('/billing/activate', data),
  checkout: (data) => api.post('/billing/checkout', data),
};
