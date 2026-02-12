import axios from "axios";

const api = axios.create({
  // baseURL: "https://lms-backend-production-f4eb.up.railway.app", // Replace with your actual API URL
  baseURL: "http://localhost:5000",
});

export default api;