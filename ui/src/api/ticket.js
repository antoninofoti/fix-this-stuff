import axios from 'axios';
import { useAuthStore } from '../store/auth.js';

const ticketApi = axios.create({
  baseURL: import.meta.env.VITE_TICKET_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

ticketApi.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default ticketApi;
