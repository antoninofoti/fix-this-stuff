import axios from 'axios';
import { useAuthStore } from '../store/auth.js';

const roleApi = axios.create({
  baseURL: import.meta.env.VITE_ROLE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

roleApi.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  // Il frontend invia SOLO il Bearer token
  // Il gateway API estrarrà user/role dal JWT e li passerà ai microservizi
  if (authStore.token) {
    config.headers['Authorization'] = `Bearer ${authStore.token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default roleApi;