const db = require('../config/db');

/**
 * Model for interacting with the moderator functionality in the users table
 * 
 * Note: This functionality was migrated from the auth-service to consolidate
 * all user management in one service. Moderators are now stored in the users table
 * with role = 'moderator'.
 */
const ModeratorModel = {
  /**
   * Get a moderator by their ID
   * @param {number} moderatorId - The ID of the moderator to fetch
   * @returns {Promise<Object|null>} The moderator or null if not found
   */
  async getModeratorById(moderatorId) {
    try {
      const query = `
        SELECT u.id, u.email, u.name, u.surname, u.registration_date
        FROM users u
        WHERE u.id = $1 AND u.role = 'moderator'
      `;
      
      const { rows } = await db.query(query, [moderatorId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error getting moderator with ID ${moderatorId}:`, error);
      throw error;
    }
  },

  /**
   * Check if a moderator exists
   * @param {number} moderatorId - The ID of the moderator to check
   * @returns {Promise<boolean>} True if the moderator exists
   */
  async exists(moderatorId) {
    try {
      const query = `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role = 'moderator') as exists`;
      const { rows } = await db.query(query, [moderatorId]);
      return rows[0].exists;
    } catch (error) {
      console.error(`Error checking if moderator ${moderatorId} exists:`, error);
      return false;
    }
  },

  /**
   * Get all moderators
   * @returns {Promise<Array>} List of all moderators
   */
  async getAllModerators() {
    try {
      const query = `
        SELECT u.id, u.email, u.name, u.surname, u.registration_date
        FROM users u
        WHERE u.role = 'moderator'
        ORDER BY u.surname, u.name
      `;
      
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Error getting all moderators:', error);
      throw error;
    }
  },

  /**
   * Create a new moderator
   * @param {Object} moderatorData - The moderator data to insert
   * @returns {Promise<Object>} The created moderator
   */
  async createModerator(moderatorData) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Insert into users with moderator role
      const userInsertQuery = `
        INSERT INTO users (name, surname, email, credentials_id, role)
        VALUES ($1, $2, $3, $4, 'moderator')
        RETURNING id, name, surname, email, registration_date, role
      `;
      
      const userParams = [
        moderatorData.name,
        moderatorData.surname,
        moderatorData.email,
        moderatorData.credentials_id
      ];
      
      const { rows } = await client.query(userInsertQuery, userParams);
      await client.query('COMMIT');
      
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating moderator:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Update a moderator
   * @param {number} moderatorId - The ID of the moderator to update
   * @param {Object} moderatorData - The data to update
   * @returns {Promise<Object|null>} The updated moderator or null if not found
   */
  async updateModerator(moderatorId, moderatorData) {
    try {
      const updateFields = [];
      const values = [];
      let paramCounter = 1;
      
      // Add fields to update
      if (moderatorData.name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        values.push(moderatorData.name);
      }
      
      if (moderatorData.surname !== undefined) {
        updateFields.push(`surname = $${paramCounter++}`);
        values.push(moderatorData.surname);
      }
      
      if (moderatorData.email !== undefined) {
        updateFields.push(`email = $${paramCounter++}`);
        values.push(moderatorData.email);
      }
      
      if (updateFields.length === 0) {
        return await this.getModeratorById(moderatorId);
      }
      
      // Add the ID parameter
      values.push(moderatorId);
      
      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter} AND role = 'moderator'
        RETURNING id, name, surname, email, registration_date
      `;
      
      const { rows } = await db.query(query, values);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error updating moderator ${moderatorId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a moderator
   * @param {number} moderatorId - The ID of the moderator to delete
   * @returns {Promise<boolean>} True if the moderator was deleted
   */
  async deleteModerator(moderatorId) {
    try {
      const query = `
        DELETE FROM users
        WHERE id = $1 AND role = 'moderator'
        RETURNING id
      `;
      
      const { rows } = await db.query(query, [moderatorId]);
      return rows.length > 0;
    } catch (error) {
      console.error(`Error deleting moderator ${moderatorId}:`, error);
      throw error;
    }
  }
};

module.exports = ModeratorModel;
