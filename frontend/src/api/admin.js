import api from './axios';

export const getUsers = (params) => api.get('/admin/users', { params });

export const createUser = (data) => api.post('/admin/users', data);

export const deactivateUser = (id) => api.patch(`/admin/users/${id}/deactivate`);

export const activateUser = (id) => api.patch(`/admin/users/${id}/activate`);

export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export const assignUserRole = (id, role) =>
  api.patch(`/admin/users/${id}/role`, { role });

export const getPendingEvents = (params) =>
  api.get('/admin/events/pending', { params });

export const approveEvent = (id) => api.post(`/admin/events/${id}/approve`);

export const rejectEvent = (id, reason) =>
  api.post(`/admin/events/${id}/reject`, { reason });

export const getEventsPerMonth = () =>
  api.get('/admin/reports/events-per-month');

export const getAvgParticipation = () =>
  api.get('/admin/reports/avg-participation');

export const getEventsPerOrganizer = () =>
  api.get('/admin/reports/events-per-organizer');

export const getAllEvents = (params) =>
  api.get('/admin/events', { params });

export const createFaculty = (data) => api.post('/admin/faculties', data);

export const createDepartment = (data) => api.post('/admin/departments', data);

export const createCategory = (data) => api.post('/admin/categories', data);
