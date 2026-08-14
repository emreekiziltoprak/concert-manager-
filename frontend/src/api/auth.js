import api from "../config/axios";

export const login = (credentials) => api.post("/auth/login", credentials);
export const register = (payload) => api.post("/auth/register", payload);
