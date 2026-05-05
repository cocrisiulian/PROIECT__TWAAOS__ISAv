import api from './axios';

export const getMyEvents = (params) => api.get('/organizer/events', { params });

export const createEvent = (data) => api.post('/organizer/events', data);

export const getMyEvent = (id) => api.get(`/organizer/events/${id}`);

export const updateEvent = (id, data) => api.put(`/organizer/events/${id}`, data);

export const submitForApproval = (id) =>
  api.patch(`/organizer/events/${id}/submit`);

export const cancelEvent = (id) => api.patch(`/organizer/events/${id}/cancel`);

export const deleteEvent = (id) => api.delete(`/organizer/events/${id}`);

export const getParticipants = (id, params) =>
  api.get(`/organizer/events/${id}/participants`, { params });

export const exportParticipants = (id) =>
  api.get(`/organizer/events/${id}/participants/export`, { responseType: 'blob' });

export const checkIn = (eventId, registrationId) =>
  api.post(`/organizer/events/${eventId}/checkin/${registrationId}`);

export const uploadMaterial = (eventId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/organizer/events/${eventId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteMaterial = (eventId, materialId) =>
  api.delete(`/organizer/events/${eventId}/materials/${materialId}`);

export const getEventStats = (id) => api.get(`/organizer/events/${id}/stats`);

export const uploadCoverImage = (file, crops) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('crops', JSON.stringify(crops));

  return api.post('/organizer/images/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
