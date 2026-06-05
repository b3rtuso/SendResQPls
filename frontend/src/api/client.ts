import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('[API] Using base URL:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === AUTH ===
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: { name: string; email: string; password: string; phoneNumber?: string; role?: string }) =>
  api.post('/auth/register', data);

export const sendVerificationCode = (email: string) =>
  api.post('/auth/send-code', { email });

export const verifyCode = (email: string, code: string) =>
  api.post('/auth/verify-code', { email, code });

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

// === INCIDENTS ===
export const reportIncident = (formData: FormData) =>
  api.post('/incidents/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateIncidentStatus = (id: string, data: { status?: string; adminNotes?: string; assignedDepartment?: string }) =>
  api.patch(`/incidents/${id}/status`, data);

export const getIncidents = () => api.get('/incidents');
export const getIncident = (id: string) => api.get(`/incidents/${id}`);
export const getIncidentStats = () => api.get('/incidents/stats');
export const getMyIncidents = (userId: string) => api.get(`/incidents/my/${userId}`);
export const reverseGeocode = (lat: number, lng: number) =>
  api.get('/incidents/geocode/reverse', { params: { lat, lng } });

// === CALL LOGS (NOT in backend) ===
export const getCallLogs = () => api.get('/call-logs');

// === ANALYTICS (NOT in backend) ===
export const getAnalytics = () => api.get('/analytics/forecast');
export const generateReport = (params: { startDate: string; endDate: string; department?: string }) =>
  api.get('/reports/generate', { params });

// === DEPARTMENTS ===
export const getDepartments = () => api.get('/departments');
export const createDepartment = (data: any) => api.post('/departments', data);
export const updateDepartment = (id: string, data: any) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id: string) => api.delete(`/departments/${id}`);

// === SETTINGS ===
export const updateProfile = (data: Record<string, string>) =>
  api.patch('/auth/profile', data);
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.patch('/auth/password', { ...data, userId: localStorage.getItem('userId') });

export default api;
