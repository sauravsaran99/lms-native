import api from "./api";

export const getBranches = () => api.get("/branches");
