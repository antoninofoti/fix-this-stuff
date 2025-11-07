/**
 * Service Registry for Auth Service
 * Handles communication with other microservices
 */
const axios = require('axios');
const { CircuitBreaker } = require('opossum');

class ServiceRegistry {
  /**
   * Verify if a user exists in the user service
   * @param {number} userId - User ID to verify
   * @returns {Promise<boolean>} True if the user exists
   */
  static async verifyUserExists(userId) {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
      const response = await axios.get(`${userServiceUrl}/users/${userId}`);
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
        const response = await axios.get(`${userServiceUrl}/users/${userId}`);
        return response.data.user;
      },
      {
        timeout: 3000, // If the function takes longer than 3 seconds, trigger a failure
        errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
        resetTimeout: 30000 // After 30 seconds, try again
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
}

module.exports = ServiceRegistry;
