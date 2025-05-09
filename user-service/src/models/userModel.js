const db = require('../config/db');
const bcrypt = require('bcrypt');

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
        SELECT u.id, u.email, u.name, u.surname, u.rank as role, u.registration_date as created_at, u.registration_date as updated_at
        FROM users u
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Add filter conditions if provided
      if (filters.role) {
        whereConditions.push(`u.rank = $${paramIndex++}`);
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
        SELECT u.id, u.email, u.name, u.surname, u.rank as role, u.registration_date as created_at, u.registration_date as updated_at
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
   * @returns {Promise<Object>} User with credentials
   */
  async getUserByEmail(email) {
    try {
      const query = `
        SELECT u.id, u.email, c.password, u.name, u.surname, u.rank as role
        FROM users u
        JOIN credentials c ON u.credentials_id = c.id
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
   * Creates a new user in the database
   * @param {Object} userData - Data for the new user
   * @returns {Promise<Object>} Created user without password
   */
  async createUser(userData) {
    try {
      // Check if email already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Start a database transaction
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        // 1. Insert credentials
        const credentialsQuery = `
          INSERT INTO credentials (username, password)
          VALUES ($1, $2)
          RETURNING id
        `;
        const credentialsValues = [userData.email, hashedPassword];
        const credentialsResult = await client.query(credentialsQuery, credentialsValues);
        const credentialsId = credentialsResult.rows[0].id;

        // 2. Insert user
        const userQuery = `
          INSERT INTO users (email, name, surname, rank, credentials_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, name, surname, rank as role, registration_date as created_at, registration_date as updated_at
        `;
        const userValues = [
          userData.email,
          userData.name,
          userData.surname,
          userData.role === 'moderator' ? 100 : 0, // Default role as number: 0=user, 100=moderator
          credentialsId
        ];
        const userResult = await client.query(userQuery, userValues);
        
        await client.query('COMMIT');
        return userResult.rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating user:', error);
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
    // Implementation omitted for brevity - would need similar updates
    throw new Error('Not implemented');
  },

  /**
   * Deletes a user from the database
   * @param {number} userId - ID of the user to delete
   * @returns {Promise<boolean>} Operation result
   */
  async deleteUser(userId) {
    // Implementation omitted for brevity - would need similar updates
    throw new Error('Not implemented');
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
   * Validates user password
   * @param {string} password - Plain password to validate
   * @param {string} hashedPassword - Stored password hash
   * @returns {Promise<boolean>} Validation result
   */
  async validatePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
};

module.exports = UserModel;