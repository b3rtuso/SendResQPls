import axios from 'axios';
import { CacheManager } from './cacheManager';
import type { ResolutionForm } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10s — fail faster, retry handles transient errors
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Retry on network/5xx & Handle 401 Unauthorized ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;

    // Handle session expiration (401 Unauthorized) on protected routes
    if (status === 401 && config && !config.url?.includes('/auth/login') && !config.url?.includes('/auth/register')) {
      ['token', 'userId', 'userName', 'userEmail', 'userRole'].forEach(k => localStorage.removeItem(k));
      const isMobile = window.location.pathname.startsWith('/mobile');
      const target = isMobile ? '/mobile/login?expired=1' : '/admin/login?expired=1';
      if (!window.location.pathname.includes('/login')) {
        window.location.href = target;
      }
      return Promise.reject(error);
    }

    // Only retry once, only on network errors or server errors (5xx)
    if (!config || config._retried) return Promise.reject(error);
    const isNetworkError = !error.response;
    const isServerError = status && status >= 500;
    if (isNetworkError || isServerError) {
      config._retried = true;
      await new Promise((r) => setTimeout(r, 800)); // wait 800ms then retry
      return api(config);
    }
    return Promise.reject(error);
  }
);

// ── Persistent SWR Cache Layer ────────────────────────────────────────────────
export function cachedGet(url: string, ttlMs = 20000) {
  const cached = CacheManager.get<any>(url);
  if (cached) {
    // Return cached immediately, revalidate in background if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      api.get(url).then(res => CacheManager.set(url, res.data, ttlMs)).catch(() => {});
    }
    return Promise.resolve({ data: cached });
  }

  return api.get(url).then((res) => {
    CacheManager.set(url, res.data, ttlMs);
    return res;
  });
}

export function invalidateCache(pattern?: string) {
  CacheManager.invalidatePattern(pattern);
}

// === AUTH ===
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: { name: string; email: string; password: string; phoneNumber?: string }) =>
  api.post('/auth/register', data);

// Email-sending routes use a longer timeout (35s) because Brevo API
// can be slow, especially when the backend is cold-starting from sleep mode.
export const sendVerificationCode = (email: string) =>
  api.post('/auth/send-code', { email }, { timeout: 35000 });

export const verifyCode = (email: string, code: string) =>
  api.post('/auth/verify-code', { email, code });

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }, { timeout: 35000 });

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

// === INCIDENTS ===
export const reportIncident = (formData: FormData) =>
  api.post('/incidents/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => {
    invalidateCache('incidents');
    return res;
  });

export const updateIncidentStatus = (id: string, data: { status?: string; adminNotes?: string; assignedDepartment?: string; resolutionForm?: ResolutionForm }) =>
  api.patch(`/incidents/${id}/status`, data).then(res => {
    invalidateCache('incidents');
    return res;
  });

export const getIncidents = () => cachedGet('/incidents', 60000);
export const getIncidentsByRange = (from: string, to: string) =>
  cachedGet(`/incidents?from=${from}&to=${to}`, 60000);
export const getIncident = (id: string) => cachedGet(`/incidents/${id}`, 30000);
export const getIncidentStats = () => cachedGet('/incidents/stats', 60000);
export const getMyIncidents = (userId: string) => cachedGet(`/incidents/my/${userId}`, 30000);

export const reverseGeocode = (lat: number, lng: number) =>
  cachedGet(`/incidents/geocode/reverse?lat=${lat}&lng=${lng}`, 300000);


// === DEPARTMENTS ===
export const getDepartments = () => cachedGet('/departments', 300000);
export const createDepartment = (data: any) =>
  api.post('/departments', data).then(res => { invalidateCache('departments'); return res; });
export const updateDepartment = (id: string, data: any) =>
  api.put(`/departments/${id}`, data).then(res => { invalidateCache('departments'); return res; });
export const deleteDepartment = (id: string) =>
  api.delete(`/departments/${id}`).then(res => { invalidateCache('departments'); return res; });

// === SETTINGS ===
export const getProfile = (userId: string) =>
  cachedGet(`/auth/profile/${userId}`, 60000);
export const updateProfile = (data: Record<string, any>) =>
  api.patch('/auth/profile', { ...data, userId: localStorage.getItem('userId') }).then(res => {
    invalidateCache('profile');
    return res;
  });
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.patch('/auth/password', { ...data, userId: localStorage.getItem('userId') });

// === ADMIN MANAGEMENT ===
export const listAdmins = () => api.get('/auth/admins');
export const createAdmin = (data: { name: string; email: string; password: string; phoneNumber?: string }) =>
  api.post('/auth/admin/create', data);
export const toggleAdminStatus = (id: string) =>
  api.patch(`/auth/admin/${id}/deactivate`);
export const deleteAdmin = (id: string) =>
  api.delete(`/auth/admin/${id}`);

// === CALL LOGS ===
export const getCallLogs = (status?: string, search?: string) => {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search) params.append('search', search);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return cachedGet(`/call-logs${qs}`, 5000);
};

export const createCallLog = (data: {
  requestId?: string;
  callerName?: string;
  department: string;
  contact: string;
  duration?: string;
  status?: string;
}) => api.post('/call-logs', data).then(res => {
  invalidateCache('call-logs');
  return res;
});

export const deleteCallLog = (id: string) => api.delete(`/call-logs/${id}`).then(res => {
  invalidateCache('call-logs');
  return res;
});

export default api;
