import api from "../config/axios";

export const getCategories = () => api.get("/categories");
export const createCategory = (payload) => api.post("/categories", payload);
export const deleteCategory = (categoryId) => api.delete("/categories", { data: { id: categoryId } });
