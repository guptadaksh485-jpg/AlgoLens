import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the JWT (if we have one) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("algolens_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid or expired, kick the user back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("algolens_token");
      localStorage.removeItem("algolens_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
