const db = require('../config/db');

/**
 * Model for interacting with the fix_this_stuff_system table
 */
const SystemModel = {
  /**
   * Get a system by its ID
   * @param {number} systemId - The ID of the system to fetch
   * @returns {Promise<Object|null>} The system or null if not found
   */
  async getSystemById(systemId) {
    try {
      const query = `
        SELECT id
        FROM fix_this_stuff_system
        WHERE id = $1
      `;
      
      const { rows } = await db.query(query, [systemId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error getting system with ID ${systemId}:`, error);
      throw error;
    }
  },

  /**
   * Check if a system exists
   * @param {number} systemId - The ID of the system to check
   * @returns {Promise<boolean>} True if the system exists
   */
  async exists(systemId) {
    try {
      const query = 'SELECT EXISTS(SELECT 1 FROM fix_this_stuff_system WHERE id = $1) as exists';
      const { rows } = await db.query(query, [systemId]);
      return rows[0].exists;
    } catch (error) {
      console.error(`Error checking if system ${systemId} exists:`, error);
      return false;
    }
  },

  /**
   * Get all systems
   * @returns {Promise<Array>} List of all systems
   */
  async getAllSystems() {
    try {
      const query = `
        SELECT id
        FROM fix_this_stuff_system
        ORDER BY id
      `;
      
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Error getting all systems:', error);
      throw error;
    }
  }
};

module.exports = SystemModel;
