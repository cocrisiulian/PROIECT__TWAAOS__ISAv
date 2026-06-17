import api from './axios';

export const getEvents = (params) => api.get('/events', { params });

export const getEvent = (id) => api.get(`/events/${id}`);

export const registerForEvent = (id) => api.post(`/events/${id}/register`);

export const unregisterFromEvent = (id) => api.delete(`/events/${id}/register`);

export const submitFeedback = (id, data) =>
  api.post(`/events/${id}/feedback`, { rating: data.rating, comment: data.comment });

export const getEventTicket = (id) => api.get(`/events/${id}/ticket`);

export const getFaculties = () => api.get('/faculties');

export const getCategories = () => api.get('/categories');

export const getDepartments = (facultyId) =>
  api.get('/departments', { params: { faculty_id: facultyId } });
