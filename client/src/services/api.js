import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:5001/api" : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Firebase ID Token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
