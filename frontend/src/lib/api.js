import axios from "axios";

export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://skillfound-backend.onrender.com"
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  timeout: 60000,
  headers: { "X-Requested-With": "SkillFound" },
});

let getToken = () => null;
let onUnauthorized = () => {};

export const connectAuth = ({ tokenGetter, unauthorized }) => {
  getToken = tokenGetter;
  onUnauthorized = unauthorized;
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) onUnauthorized();
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message ||
  (error?.code === "ECONNABORTED" ? "The server took too long to respond." : null) ||
  (error?.message === "Network Error" ? "Can't reach the server. Check your connection." : null) ||
  fallback;

export const errorCode = (error) => error?.response?.data?.code;
