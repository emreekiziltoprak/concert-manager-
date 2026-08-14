import api from "../config/axios";

export const getProfile = () => api.get("/users/profile");
