import api from './axios';

export const getMyAccountOverview = (year, month) =>
  api.get('/account/me', { params: { year, month } });

export const updateMyAccountProfile = (payload) =>
  api.put('/account/me', payload);
