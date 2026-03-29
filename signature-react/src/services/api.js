/**
 * services/api.js
 *
 * Single-server architecture:
 *   Django serves BOTH the React build AND the API on port 8000.
 *   One ngrok tunnel covers everything — no URL mismatch possible.
 *
 * BASE_URL resolution:
 *   - In production/ngrok: window.location.origin  (same host, no port suffix)
 *   - In local dev (npm start on :3000): proxy to localhost:8000
 */
import axios from 'axios';

// window.location.origin = "https://xxxx.ngrok-free.app" when via ngrok
//                        = "http://localhost:8000" when served by Django directly
//                        = "http://localhost:3000" when using npm start (dev)
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.port === '3000'
    ? 'http://localhost:8000'          // npm start dev mode → hit Django directly
    : window.location.origin);         // served by Django (port 8000 or ngrok)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,  // 3 minutes — covers model load time on first request
});

// Attach JWT token to every request automatically.
api.interceptors.request.use((config) => {
  const url = config.url || '';
  // Admin endpoints use adminToken, all other endpoints use user token
  const isAdminEndpoint = url.includes('/api/admin/');
  const token = isAdminEndpoint
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth helpers ─────────────────────────────────────────────────────────────
export const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};

export const isLoggedIn = () => !!localStorage.getItem('token');

// ── User endpoints ────────────────────────────────────────────────────────────
export const registerUser     = (data)     => api.post('/api/users/register/', data);
export const loginUser        = (data)     => api.post('/api/users/login/', data);
export const forgotPassword   = (data)     => api.post('/api/users/forgot-password/', data);
export const verifyOTP        = (data)     => api.post('/api/users/verify-otp/', data);
export const resetPassword    = (data)     => api.post('/api/users/reset-password/', data);
export const predictSignature = (formData) =>
  api.post('/api/users/predict/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const simulateTrain = () => api.post('/api/users/train/');

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminLogin   = (data) => api.post('/api/admin/login/', data);
export const getUsers     = ()     => api.get('/api/admin/users/');
export const activateUser = (id)   => api.patch(`/api/admin/users/${id}/activate/`);
export const deleteUser   = (id)   => api.delete(`/api/admin/users/${id}/delete/`);

export default api;
