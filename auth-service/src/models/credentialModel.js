const db = require('../config/db');

/**
 * Model for interacting with the credentials table
 */
const CredentialModel = {
  /**
   * Get a credential by its ID
   * @param {number} credentialId - The ID of the credential to fetch
   * @returns {Promise<Object|null>} The credential or null if not found
   */
  async getCredentialById(credentialId) {
    try {
      const query = `
        SELECT id, username, password, registration_date
        FROM credentials
        WHERE id = $1
      `;
      
      const { rows } = await db.query(query, [credentialId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error getting credential with ID ${credentialId}:`, error);
      throw error;
    }
  },

  /**
   * Get a credential by username
   * @param {string} username - The username (email) to search for
   * @returns {Promise<Object|null>} The credential or null if not found
   */
  async getCredentialByUsername(username) {
    try {
      const query = `
        SELECT id, username, password, registration_date 
        FROM credentials
        WHERE username = $1
      `;
      const { rows } = await db.query(query, [username]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error getting credential with username ${username}:`, error);
      throw error;
    }
  },

  /**
   * Create a new credential
   * @param {string} username - The username (email)
   * @param {string} hashedPassword - The hashed password
   * @returns {Promise<Object>} The created credential (id, username, registration_date)
   */
  async createCredential(username, hashedPassword) {
    try {
      const query = `
        INSERT INTO credentials (username, password)
        VALUES ($1, $2)
        RETURNING id, username, registration_date
      `;
      const { rows } = await db.query(query, [username, hashedPassword]);
      return rows[0];
    } catch (error) {
      console.error(`Error creating credential for ${username}:`, error);
      throw error;
    }
  },

  /**
   * Delete a credential by its ID
   * @param {number} credentialId - The ID of the credential to delete
   * @returns {Promise<boolean>} True if a credential was deleted, false otherwise
   */
  async deleteCredentialById(credentialId) {
    try {
      const query = `
        DELETE FROM credentials
        WHERE id = $1
      `;
      const result = await db.query(query, [credentialId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting credential with ID ${credentialId}:`, error);
      throw error;
    }
  },

  /**
   * Check if a credential exists
   * @param {number} credentialId - The ID of the credential to check
   * @returns {Promise<boolean>} True if the credential exists
   */
  async exists(credentialId) {
    try {
      const query = 'SELECT EXISTS(SELECT 1 FROM credentials WHERE id = $1) as exists';
      const { rows } = await db.query(query, [credentialId]);
      return rows[0].exists;
    } catch (error) {
      console.error(`Error checking if credential ${credentialId} exists:`, error);
      return false;
    }
  }
};

module.exports = CredentialModel;
