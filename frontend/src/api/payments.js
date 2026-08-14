import api from "../config/axios";

export const checkout = (payload, config) => api.post("/payments/checkout", payload, config);
