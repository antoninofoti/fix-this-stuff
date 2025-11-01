import { defineStore } from 'pinia';
import userApi from '../api/user';

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    currentUser: null,
    loading: false,
    error: null,
  }),

  getters: {
    getUsers: (state) => state.users,
    getCurrentUser: (state) => state.currentUser,
  },

  actions: {
    async fetchUsers() {
      this.loading = true;
      try {
        const response = await userApi.get('/');
        this.users = response.data.users;
      } catch (error) {
        this.error = error.message || 'Failed to fetch users.';
      } finally {
        this.loading = false;
      }
    },

    async fetchUserById(userId) {
      this.loading = true;
      try {
        const response = await userApi.get(`/${userId}`);
        this.currentUser = response.data.user;
      } catch (error) {
        this.error = error.message || 'Failed to fetch user.';
      } finally {
        this.loading = false;
      }
    },

    async updateUser(userId, userData) {
      this.loading = true;
      this.error = null;
      try {
        const url = `/${userId}`;
        const body = userData;
        const response = await userApi.put(url, body);
        this.currentUser = response.data.user
      } catch (error) {
        this.error = error.message || 'Failed to update user.';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteUser(userId) {
      this.loading = true;
      try {
        await userApi.delete(`/${userId}`);
        this.users = this.users.filter(user => user.id !== userId);
        if (this.currentUser?.id === userId) this.currentUser = null;
      } catch (error) {
        this.error = error.message || 'Failed to delete user.';
      } finally {
        this.loading = false;
      }
    }
  }
});