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

// Resolution workflow methods
export const requestResolution = (ticketId) => {
  return ticketApi.post(`/tickets/${ticketId}/request-resolution`);
};

export const approveResolution = (ticketId) => {
  return ticketApi.post(`/tickets/${ticketId}/approve-resolution`);
};

export const rejectResolution = (ticketId, reason) => {
  return ticketApi.post(`/tickets/${ticketId}/reject-resolution`, { reason });
};

export const getPendingApprovalTickets = () => {
  return ticketApi.get('/tickets/pending-approval');
};

export const getLeaderboard = (limit = 10) => {
  return ticketApi.get(`/leaderboard/top?limit=${limit}`);
};

export const getDeveloperStats = (developerId) => {
  return ticketApi.get(`/leaderboard/developer/${developerId}`);
};

export default ticketApi;
