import axios from 'axios';
import { useAuthStore, isTokenExpired } from '../store/authStore.js';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  
  // Dacă token-ul este expirat, nu-l trimite și redirecționează la login
  if (token && isTokenExpired(token)) {
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
    window.location.href = '/login';
    return Promise.reject(new Error('Token expirat'));
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratează 401 (token invalid/expirat de către server)
    if (error.response?.status === 401) {
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
