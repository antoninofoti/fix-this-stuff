import axios from 'axios';
import { useAuthStore } from '../store/auth.js';

const userApi = axios.create({
  baseURL: import.meta.env.VITE_USER_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

userApi.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default userApi;
