import api from "../config/axios";

export const createTicketType = (eventId, payload) => api.post(`/events/${eventId}/ticket-types`, payload);
export const updateTicketType = (eventId, ticketTypeId, payload) =>
  api.put(`/events/${eventId}/ticket-types/${ticketTypeId}`, payload);
export const deleteTicketType = (eventId, ticketTypeId) =>
  api.delete(`/events/${eventId}/ticket-types/${ticketTypeId}`);
