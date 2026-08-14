import axios from 'axios';

// Base URL — replace with real backend URL when available
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('civicsync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Complaints / Reports ─────────────────────────────────────────────────────
export const getMyReports      = ()         => api.get('/complaints/my');
export const getReportById     = (id)       => api.get(`/complaints/${id}`);
export const submitReport      = (data)     => api.post('/complaints', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const submitRating      = (id, rating) => api.patch(`/complaints/${id}/rating`, { rating });

// ─── Bin Locations ────────────────────────────────────────────────────────────
export const getBinLocations   = ()         => api.get('/bins/public');

// ─── City Statistics ──────────────────────────────────────────────────────────
export const getCityStats      = ()         => api.get('/stats/public');

// ─── Citizen Profile ──────────────────────────────────────────────────────────
export const getProfile        = ()         => api.get('/citizens/me');
export const updateProfile     = (data)     => api.put('/citizens/me', data);
export const updateNotifications = (prefs)  => api.patch('/citizens/me/notifications', prefs);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginCitizen      = (phone, password) => api.post('/auth/citizen/login', { phone, password });
export const registerCitizen   = (data)    => api.post('/auth/citizen/register', data);

export default api;
