const db = require('../config/db');
const bcrypt = require('bcrypt');
const ServiceRegistry = require('../services/serviceRegistry');

/**
 * Model for interacting with the users and credentials tables
 */
const UserModel = {
  /**
   * Retrieves all users from the database with optional filters
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of users
   */
  async getAllUsers(filters = {}) {
    try {
      // Base query
      let query = `
        SELECT u.id, u.email, u.name, u.surname, u.role, u.rank, u.registration_date as created_at, u.registration_date as updated_at
        FROM users u
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Add filter conditions if provided
      if (filters.role) {
        whereConditions.push(`u.role = $${paramIndex++}`);
        queryParams.push(filters.role);
      }

      if (filters.search) {
        whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.surname ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Add the WHERE clause if there are conditions
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      // Add sorting
      query += ' ORDER BY u.surname ASC';

      const { rows } = await db.query(query, queryParams);
      return rows;
    } catch (error) {
      console.error('Error retrieving users:', error);
      throw error;
    }
  },

  /**
   * Retrieves a specific user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User
   */
  async getUserById(userId) {
    try {
      const query = `
        SELECT u.id, u.email, u.name, u.surname, u.role, u.rank, u.registration_date as created_at, u.registration_date as updated_at
        FROM users u
        WHERE u.id = $1
      `;

      const { rows } = await db.query(query, [userId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error retrieving user with ID ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves a user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User
   */
  async getUserByEmail(email) {
    try {
      const query = `
        SELECT u.id, u.email, u.name, u.surname, u.role, u.credentials_id
        FROM users u
        WHERE u.email = $1
      `;
      const { rows } = await db.query(query, [email]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error retrieving user by email ${email}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves a user by their email address.
   * @param {string} email - The email address of the user.
   * @returns {Promise<Object|null>} The user object if found, otherwise null.
   */
  async findByEmail(email) {
    try {
      const query = `
        SELECT id, email, name, surname, role, credentials_id, registration_date
        FROM users
        WHERE email = $1
      `;
      const { rows } = await db.query(query, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves a user by their credentials_id.
   * @param {number} credentialsId - The credentials_id of the user.
   * @returns {Promise<Object|null>} The user object if found, otherwise null.
   */
  async findByCredentialsId(credentialsId) {
    try {
      const query = `
        SELECT id, email, name, surname, role, credentials_id, registration_date
        FROM users
        WHERE credentials_id = $1
      `;
      const { rows } = await db.query(query, [credentialsId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error finding user by credentials_id ${credentialsId}:`, error);
      throw error;
    }
  },

  /**
   * Updates an existing user
   * @param {number} userId - ID of the user to update
   * @param {Object} userData - New data for the user
   * @returns {Promise<Object>} Updated user without password
   */
  async updateUser(userId, userData) {
    try {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        const updates = [];
        const values = [];
        let paramIndex = 1;

        // SECURITY: Explicitly reject attempts to change role field through this method
        // Role changes should only happen through updateUserRole which has proper authorization
        if (userData.role !== undefined) {
          throw new Error('Role changes are not allowed through the general update method');
        }

        // If credential_id is provided, validate it exists in the auth service
        if (userData.credentials_id) {
          const credentialExists = await ServiceRegistry.verifyCredentialsExist(userData.credentials_id);
          if (!credentialExists) {
            throw new Error(`Credential ID ${userData.credentials_id} does not exist`);
          }
          
          updates.push(`credentials_id = $${paramIndex++}`);
          values.push(userData.credentials_id);
        }

        // Add other fields to update
        if (userData.email) {
          updates.push(`email = $${paramIndex++}`);
          values.push(userData.email);
        }

        // Handle both name/firstName and surname/lastName naming conventions
        if (userData.name || userData.firstName) {
          updates.push(`name = $${paramIndex++}`);
          values.push(userData.name || userData.firstName);
        }

        if (userData.surname || userData.lastName) {
          updates.push(`surname = $${paramIndex++}`);
          values.push(userData.surname || userData.lastName);
        }

        if (userData.rank !== undefined) {
          updates.push(`rank = $${paramIndex++}`);
          values.push(userData.rank);
        }

        if (updates.length === 0) {
          return await this.getUserById(userId);
        }

        // Add userId to values
        values.push(userId);

        // Build and execute update query
        const query = `
          UPDATE users
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id, email, name, surname, role, registration_date as created_at
        `;

        const result = await client.query(query, values);
        await client.query('COMMIT');
        
        return result.rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Updates a user's role - This method should only be called after proper authorization
   * @param {number} userId - ID of the user to update
   * @param {string} role - New role for the user (admin, moderator, user)
   * @param {number} adminId - ID of the admin making the change (for audit)
   * @returns {Promise<Object>} Updated user
   */

  //problema: la funzione cerca di scrivere su due colonne che non esistono: last_updated_by e last_updated_at, modifica query o aggiungi colonne?
  //CHIEDERE ANTONINO
  async updateUserRole(userId, role, adminId) {
    try {
      // Validate the role
      if (!['admin', 'moderator', 'user'].includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      // Protect the default admin from role changes
      if (userId === 1 && role !== 'admin') {
        throw new Error('Cannot change role of default administrator');
      }
      
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        
        // Check if user exists
        const { rows: currentUserRows } = await client.query(
          'SELECT id FROM users WHERE id = $1',
          [userId]
        );
        
        if (currentUserRows.length === 0) {
          throw new Error(`User ${userId} not found`);
        }
        
        // Update role 
        const query = `
          UPDATE users
          SET role = $1
          WHERE id = $2
          RETURNING id, email, name, surname, role, registration_date as created_at
        `;
        const { rows } = await client.query(query, [role, userId]);
        await client.query('COMMIT');
        // Log the role change for audit
        console.log(`User ${userId} role updated to ${role} by admin ${adminId}`);
        return rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error updating user role for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a user from the database
   * @param {number} userId - ID of the user to delete
   * @returns {Promise<boolean>} Operation result
   */
  async delete(userId) {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      const { rowCount } = await db.query(query, [userId]);
      return rowCount > 0;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Verifies user credentials for login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object|null>} User object if credentials are valid, null otherwise
   */
  async verifyCredentials(email, password) {
    try {
      // Get user with password
      const user = await this.getUserByEmail(email);
      if (!user) {
        return null;
      }

      // Validate password
      const isValid = await this.validatePassword(password, user.password);
      if (!isValid) {
        return null;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  },

  /**
   * Get user by credentials ID
   * @param {number} credentialsId - The credentials ID to search for
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByCredentialId(credentialsId) {
    try {
      const query = `
        SELECT u.id, u.email, u.name as firstName, u.surname as lastName, u.role, u.credentials_id, u.registration_date as created_at
        FROM users u
        WHERE u.credentials_id = $1
      `;
      const { rows } = await db.query(query, [credentialsId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error retrieving user by credentials ID ${credentialsId}:`, error);
      throw error;
    }
  },

  /**
   * Create user (internal method for auth-service)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      const { email, firstName, lastName, role, credentialsId } = userData;
      
      // Check if user with this email already exists
      const existingUserByEmail = await this.findByEmail(email);
      if (existingUserByEmail) {
        const error = new Error('User with this email already exists');
        error.code = 'DUPLICATE_EMAIL';
        error.statusCode = 409;
        throw error;
      }
      
      // Check if user with this credentialsId already exists
      const existingUserByCredentialsId = await this.findByCredentialsId(credentialsId);
      if (existingUserByCredentialsId) {
        const error = new Error('User with this credentialsId already exists');
        error.code = 'DUPLICATE_CREDENTIALS';
        error.statusCode = 409;
        throw error;
      }
      
      const query = `
        INSERT INTO users (email, name, surname, role, credentials_id, registration_date)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, email, name as firstName, surname as lastName, role, credentials_id, registration_date as created_at
      `;
      
      const { rows } = await db.query(query, [email, firstName, lastName, role || 'developer', credentialsId]);
      return rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Validates user password
   * @param {string} password - Plain password to validate
   * @param {string} hashedPassword - Stored password hash
   * @returns {Promise<boolean>} Validation result
   */
  async validatePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  },

  /**
   * Updates user rank
   * @param {number} userId - User ID
   * @param {number} newRank - New rank value
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRank(userId, newRank) {
    try {
      const query = `
        UPDATE users
        SET rank = $1
        WHERE id = $2
        RETURNING id, email, name, surname, role, rank, registration_date
      `;
      
      const { rows } = await db.query(query, [newRank, userId]);
      return rows[0];
    } catch (error) {
      console.error(`Error updating rank for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get leaderboard - users ordered by rank
   * @param {number} limit - Maximum number of users to return (default: 10)
   * @returns {Promise<Array>} List of top users by rank
   */
  async getLeaderboard(limit = 10) {
    try {
      const query = `
        SELECT id, name, surname, email, role, rank, registration_date
        FROM users
        ORDER BY rank DESC, registration_date ASC
        LIMIT $1
      `;
      
      const { rows } = await db.query(query, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
};

module.exports = UserModel;