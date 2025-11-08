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

// Get leaderboard
export const getLeaderboard = async (limit = 10) => {
  const response = await userApi.get(`/leaderboard?limit=${limit}`);
  return response.data;
};

// Search users
export const searchUsers = async (query, limit = 20) => {
  const response = await userApi.get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.data;
};

export default userApi;
