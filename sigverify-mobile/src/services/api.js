/**
 * src/services/api.js
 *
 * Points to your Django backend.
 * Change BASE_URL to your laptop's IP or ngrok URL.
 *
 * Options:
 *   1. LAN (same WiFi): 'http://192.168.x.x:8000'
 *   2. ngrok:           'https://xxxx.ngrok-free.app'
 *
 * Run: python run_app.py --skip-build
 * The URL is printed in the terminal when the app starts.
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── CHANGE THIS TO YOUR BACKEND URL ────────────────────────────────────────
export const BASE_URL = 'http://10.94.207.193:8000';
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Attach JWT automatically — admin endpoints use adminToken, others use token
api.interceptors.request.use(async (config) => {
  const isAdmin = (config.url || '').includes('/api/admin/');
  const key     = isAdmin ? 'adminToken' : 'token';
  try {
    const token = await SecureStore.getItemAsync(key);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// ── Token helpers ─────────────────────────────────────────────────────────────
export const saveAuth = async (token, user) => {
  await SecureStore.setItemAsync('token', token);
  await SecureStore.setItemAsync('user', JSON.stringify(user));
};

export const clearAuth = async () => {
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('user');
};

export const getUser = async () => {
  try {
    const u = await SecureStore.getItemAsync('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const getToken = async () => {
  try { return await SecureStore.getItemAsync('token'); }
  catch { return null; }
};

export const isLoggedIn = async () => !!(await getToken());

// ── User endpoints ────────────────────────────────────────────────────────────
export const loginUser      = (data) => api.post('/api/users/login/', data);
export const registerUser   = (data) => api.post('/api/users/register/', data);
export const forgotPassword = (data) => api.post('/api/users/forgot-password/', data);
export const verifyOTP      = (data) => api.post('/api/users/verify-otp/', data);
export const resetPassword  = (data) => api.post('/api/users/reset-password/', data);
export const simulateTrain  = ()     => api.post('/api/users/train/');

export const predictSignature = (formData) =>
  api.post('/api/users/predict/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminLogin   = (data) => api.post('/api/admin/login/', data);
export const getUsers     = ()     => api.get('/api/admin/users/');
export const activateUser = (id)   => api.patch(`/api/admin/users/${id}/activate/`);
export const deleteUser   = (id)   => api.delete(`/api/admin/users/${id}/delete/`);

export default api;
