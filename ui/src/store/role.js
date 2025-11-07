import { defineStore } from 'pinia';
import roleApi from '../api/role';

export const useRoleStore = defineStore('role', {
  state: () => ({
    roles: [],
    currentRole: null,
    loading: false,
    error: null,
  }),

  getters: {
    getRoles: (state) => state.roles,
    getCurrentRole: (state) => state.currentRole,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchRoles() {
      this.loading = true;
      this.error = null;
      try {
        const response = await roleApi.get('/');
        this.roles = response.data.roles || response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch roles.';
        console.error('Error fetching roles:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchRoleById(roleId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await roleApi.get(`/${roleId}`);
        this.currentRole = response.data.role || response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch role.';
        console.error('Error fetching role:', error);
      } finally {
        this.loading = false;
      }
    },

    async createRole(roleData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await roleApi.post('/', roleData);
        const newRole = response.data.role || response.data;
        this.roles.push(newRole);
        return newRole;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to create role.';
        console.error('Error creating role:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateRole(roleId, roleData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await roleApi.put(`/${roleId}`, roleData);
        const updatedRole = response.data.role || response.data;
        
        // Update in the roles array
        const index = this.roles.findIndex(r => r.id === roleId);
        if (index !== -1) {
          this.roles[index] = updatedRole;
        }
        
        // Update current role if it's the same
        if (this.currentRole?.id === roleId) {
          this.currentRole = updatedRole;
        }
        
        return updatedRole;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to update role.';
        console.error('Error updating role:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteRole(roleId) {
      this.loading = true;
      this.error = null;
      try {
        await roleApi.delete(`/${roleId}`);
        
        // Remove from roles array
        this.roles = this.roles.filter(r => r.id !== roleId);
        
        // Clear current role if it was deleted
        if (this.currentRole?.id === roleId) {
          this.currentRole = null;
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete role.';
        console.error('Error deleting role:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    },

    clearCurrentRole() {
      this.currentRole = null;
    }
  }
});
