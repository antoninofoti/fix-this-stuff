/**
 * Service Registry for User Service
 * Handles communication with other microservices
 */
const axios = require('axios');
const { CircuitBreaker } = require('opossum');

class ServiceRegistry {
  /**
   * Verify if credentials exist in the auth service
   * @param {number} credentialsId - Credentials ID to verify
   * @returns {Promise<boolean>} True if the credentials exist
   */
  static async verifyCredentialsExist(credentialsId) {
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
      const response = await axios.get(`${authServiceUrl}/api/auth/credentials/${credentialsId}`);
      return !!response.data.credentials;
    } catch (error) {
      console.error(`Error verifying credentials ${credentialsId}:`, error.message);
      return false;
    }
  }

  /**
   * Get moderator info directly from the user service database
   * @param {number} moderatorId - Moderator ID to fetch
   * @returns {Promise<Object|null>} Moderator object or null if not found
   */
  static async getModeratorDetails(moderatorId) {
    try {
      const moderatorModel = require('../models/moderatorModel');
      return await moderatorModel.getModeratorById(moderatorId);
    } catch (error) {
      console.error(`Error getting moderator details for ${moderatorId}:`, error.message);
      return null;
    }
  }
}

module.exports = ServiceRegistry;
