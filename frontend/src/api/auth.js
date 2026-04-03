import api from './axios';

export const loginStaff = (username, password) =>
  api.post('/auth/login', { username, password });

export const signUp = (payload) =>
  api.post('/auth/signup', payload);

export const logout = () =>
  api.post('/auth/logout');

export const requestPasswordReset = (email) =>
  api.post('/auth/password/forgot', { email });

export const confirmPasswordReset = (token, newPassword) =>
  api.post('/auth/password/reset', { token, new_password: newPassword });

export const getGoogleAuthUrl = () => api.get('/auth/google/url');

export const handleGoogleCallback = (code, state) =>
  api.post('/auth/google/callback', { code, state });

export const getMe = () => api.get('/auth/me');
