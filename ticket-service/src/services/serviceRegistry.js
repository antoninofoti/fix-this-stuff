/**
 * Service Registry for Ticket Service
 * Handles communication with other microservices
 */
const axios = require('axios');
const CircuitBreaker = require('opossum');

class ServiceRegistry {
  /**
   * Verify if a user exists in the user service
   * @param {number} userId - User ID to verify
   * @returns {Promise<boolean>} True if the user exists
   */
  static async verifyUserExists(userId) {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
        const response = await axios.get(`${userServiceUrl}/users/internal/${userId}`);
        
      return !!response.data.user;
    } catch (error) {
      console.error(`Error verifying user ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Get user details from the user service
   * @param {number} userId - User ID to fetch
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async getUserDetails(userId) {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
    
    // Create a circuit breaker for the user service
    const breaker = new CircuitBreaker(
      async function() {
        const response = await axios.get(`${userServiceUrl}/users/internal/${userId}`);
        return response.data.user;
      },
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );

    // Provide a fallback response when the service is unavailable
    breaker.fallback(() => ({
      id: userId,
      name: 'Unknown',
      surname: 'User',
      email: 'service.unavailable@example.com'
    }));

    try {
      return await breaker.fire();
    } catch (error) {
      console.error(`Circuit breaker error for user ${userId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch aggregated ticket data with user details
   * @param {number} ticketId - Ticket ID to get complete data for
   * @returns {Promise<Object|null>} Complete ticket object with user details
   */
  static async getCompleteTicketData(ticketId, ticketModel) {
    try {
      // Get the basic ticket data
      const ticket = await ticketModel.getTicketById(ticketId);
      if (!ticket) return null;
      
      // Fetch author details
      if (ticket.request_author_id) {
        ticket.author = await this.getUserDetails(ticket.request_author_id);
      }
      
      // Fetch developer details if assigned
      if (ticket.assigned_developer_id) {
        ticket.developer = await this.getUserDetails(ticket.assigned_developer_id);
      }
      
      return ticket;
    } catch (error) {
      console.error(`Error fetching complete ticket data for ${ticketId}:`, error.message);
      return null;
    }
  }

  /**
   * Get moderator details from the user service
   * @param {number} moderatorId - Moderator ID to fetch
   * @returns {Promise<Object|null>} Moderator object or null if not found
   */
  static async getModeratorDetails(moderatorId) {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
    
    // Create a circuit breaker for the user service
    const breaker = new CircuitBreaker(
      async function() {
        const response = await axios.get(`${userServiceUrl}/api/moderators/${moderatorId}`);
        return response.data.moderator;
      },
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );

    // Provide a fallback response when the service is unavailable
    breaker.fallback(() => ({
      id: moderatorId,
      name: 'Unknown',
      surname: 'Moderator',
      email: 'service.unavailable@example.com'
    }));

    try {
      return await breaker.fire();
    } catch (error) {
      console.error(`Circuit breaker error for moderator ${moderatorId}:`, error.message);
      return null;
    }
  }
}

module.exports = ServiceRegistry;
