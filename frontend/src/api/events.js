import api from "../config/axios";

export const getEvents = () => api.get("/events");
export const getEvent = (eventId) => api.get(`/events/${eventId}`);
export const createEvent = (payload) => api.post("/events", payload);
export const updateEvent = (eventId, payload) => api.put(`/events/${eventId}`, payload);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);
