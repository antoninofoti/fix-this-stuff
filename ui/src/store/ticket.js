import { defineStore } from 'pinia'
import ticketApi from '../api/ticket'

export const useTicketStore = defineStore('ticket', {
  state: () => ({
    tickets: [],
    currentTicket: null,
    loading: false,
    error: null,
  }),
  getters: {
    getTickets: (state) => state.tickets,
    getCurrentTicket: (state) => state.currentTicket,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },
  actions: {
    async createTicket(data) {
      this.loading = true;
      this.error = null;
      try {
        const response = await ticketApi.post('/', data);
        const newTicket = response.data.ticket || response.data;
        this.tickets.push(newTicket);
        this.currentTicket = newTicket;
        return newTicket;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to create ticket.';
        console.error('Error creating ticket:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchAllTickets() {
      this.loading = true;
      this.error = null;
      try {
        const response = await ticketApi.get('/');
        this.tickets = response.data.tickets || response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch tickets.';
        console.error('Error fetching tickets:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchTicketByID(ticketId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await ticketApi.get(`/${ticketId}`);
        this.currentTicket = response.data.ticket || response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch ticket.';
        console.error('Error fetching ticket:', error);
        
        // Fallback: try to find in local tickets array
        const localTicket = this.tickets.find(t => t.id == ticketId);
        if (localTicket) {
          this.currentTicket = localTicket;
        }
      } finally {
        this.loading = false;
      }
    },

    async updateTicket(ticketId, ticketData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await ticketApi.put(`/${ticketId}`, ticketData);
        const updatedTicket = response.data.ticket || response.data;
        
        // Update in the tickets array
        const index = this.tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
          this.tickets[index] = updatedTicket;
        }
        
        // Update current ticket if it's the same
        if (this.currentTicket?.id === ticketId) {
          this.currentTicket = updatedTicket;
        }
        
        return updatedTicket;
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to update ticket.';
        console.error('Error updating ticket:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteTicket(ticketId) {
      this.loading = true;
      this.error = null;
      try {
        await ticketApi.delete(`/${ticketId}`);
        
        // Remove from tickets array
        this.tickets = this.tickets.filter(t => t.id !== ticketId);
        
        // Clear current ticket if it was deleted
        if (this.currentTicket?.id === ticketId) {
          this.currentTicket = null;
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete ticket.';
        console.error('Error deleting ticket:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    },

    clearCurrentTicket() {
      this.currentTicket = null;
    }
  },
})