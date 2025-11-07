const db = require('../config/db');

/**
 * Model for interacting with the ticket table
 */
const TicketModel = {
  /**
   * Retrieves all tickets from the database with optional filters
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of tickets
   */
  async getAllTickets(filters = {}) {
    try {
      // Build the base query
      let query = `
        SELECT t.*, array_agg(tp.name) as topics
        FROM ticket t
        LEFT JOIN ticket_topic tt ON t.id = tt.ticket_id
        LEFT JOIN topic tp ON tt.topic_id = tp.id
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Add filter conditions if provided
      if (filters.status) {
        whereConditions.push(`t.flag_status = $${paramIndex++}`);
        queryParams.push(filters.status);
      }

      if (filters.priority) {
        whereConditions.push(`t.priority = $${paramIndex++}`);
        queryParams.push(filters.priority);
      }

      if (filters.solveStatus) {
        whereConditions.push(`t.solve_status = $${paramIndex++}`);
        queryParams.push(filters.solveStatus);
      }

      if (filters.topic) {
        whereConditions.push(`tp.name = $${paramIndex++}`);
        queryParams.push(filters.topic);
      }

      if (filters.authorId) {
        whereConditions.push(`t.request_author_id = $${paramIndex++}`);
        queryParams.push(filters.authorId);
      }

      if (filters.developerId) {
        whereConditions.push(`t.assigned_developer_id = $${paramIndex++}`);
        queryParams.push(filters.developerId);
      }

      // Add the WHERE clause if there are conditions
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      // Add GROUP BY to handle the array_agg
      query += ' GROUP BY t.id';

      // Add sorting if specified
      if (filters.orderBy) {
        const orderDir = filters.orderDir === 'desc' ? 'DESC' : 'ASC';
        const safeOrderBy = this.getSafeOrderByColumn(filters.orderBy);
        query += ` ORDER BY ${safeOrderBy} ${orderDir}`;
      } else {
        query += ' ORDER BY t.id DESC'; // Default order
      }

      const { rows } = await db.query(query, queryParams);
      return rows;
    } catch (error) {
      console.error('Error retrieving tickets:', error);
      throw error;
    }
  },

  /**
   * Converts the column name for sorting to a safe name
   * @param {string} orderBy - Column name for sorting provided by the user
   * @returns {string} Safe column name
   */
  getSafeOrderByColumn(orderBy) {
    // Map of safe column names
    const safeColumns = {
      'id': 't.id',
      'title': 't.title',
      'priority': 't.priority',
      'deadline': 't.deadline_date',
      'status': 't.flag_status',
      'solve_status': 't.solve_status',
      'created': 't.creation_date',
      'author': 'u.surname'
    };

    return safeColumns[orderBy] || 't.id';
  },

  /**
   * Retrieves a specific ticket by ID
   * @param {number} ticketId - Ticket ID
   * @returns {Promise<Object>} Ticket
   */
  async getTicketById(ticketId) {
    try {
      const query = `
        SELECT t.*, array_agg(tp.name) as topics
        FROM ticket t
        LEFT JOIN ticket_topic tt ON t.id = tt.ticket_id
        LEFT JOIN topic tp ON tt.topic_id = tp.id
        WHERE t.id = $1
        GROUP BY t.id
      `;
      const { rows } = await db.query(query, [ticketId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(`Error retrieving ticket with ID ${ticketId}:`, error);
      throw error;
    }
  },

  /**
   * Creates a new ticket in the database
   * @param {Object} ticketData - Data for the new ticket
   * @returns {Promise<Object>} Created ticket
   */
  async createTicket(ticketData) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Insert ticket
      const insertTicketQuery = `
        INSERT INTO ticket (
          title, priority, deadline_date, flag_status, solve_status, 
          request, request_author_id, assigned_developer_id, system_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const ticketParams = [
        ticketData.title,
        ticketData.priority,
        ticketData.deadline_date || null,
        ticketData.flag_status || 'open',  // Default 'open'
        ticketData.solve_status || 'not_solved',  // Default 'not_solved'
        ticketData.request,
        ticketData.request_author_id,
        ticketData.assigned_developer_id || null,
        ticketData.system_id
      ];

      const ticketResult = await client.query(insertTicketQuery, ticketParams);
      const newTicket = ticketResult.rows[0];

      // Insert topic-ticket relationships if provided
      if (ticketData.topics && Array.isArray(ticketData.topics) && ticketData.topics.length > 0) {
        // First get the topic IDs
        const getTopicIdsQuery = `SELECT id FROM topic WHERE name = ANY($1)`;
        const topicResult = await client.query(getTopicIdsQuery, [ticketData.topics]);
        const topicIds = topicResult.rows.map(row => row.id);

        // Then insert the relationships
        for (const topicId of topicIds) {
          await client.query(
            'INSERT INTO ticket_topic (ticket_id, topic_id) VALUES ($1, $2)',
            [newTicket.id, topicId]
          );
        }
      }

      await client.query('COMMIT');
      return await this.getTicketById(newTicket.id); // Returns the complete ticket with relationships
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating ticket:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Updates an existing ticket
   * @param {number} ticketId - ID of the ticket to update
   * @param {Object} ticketData - New data for the ticket
   * @returns {Promise<Object>} Updated ticket
   */
  async updateTicket(ticketId, ticketData) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Prepare the update query
      let query = 'UPDATE ticket SET';
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Add only the fields present in ticketData
      if (ticketData.title !== undefined) {
        updates.push(` title = $${paramIndex++}`);
        values.push(ticketData.title);
      }
      if (ticketData.priority !== undefined) {
        updates.push(` priority = $${paramIndex++}`);
        values.push(ticketData.priority);
      }
      if (ticketData.deadline_date !== undefined) {
        updates.push(` deadline_date = $${paramIndex++}`);
        values.push(ticketData.deadline_date);
      }
      if (ticketData.flag_status !== undefined) {
        updates.push(` flag_status = $${paramIndex++}`);
        values.push(ticketData.flag_status);
      }
      if (ticketData.solve_status !== undefined) {
        updates.push(` solve_status = $${paramIndex++}`);
        values.push(ticketData.solve_status);
      }
      if (ticketData.request !== undefined) {
        updates.push(` request = $${paramIndex++}`);
        values.push(ticketData.request);
      }
      if (ticketData.assigned_developer_id !== undefined) {
        updates.push(` assigned_developer_id = $${paramIndex++}`);
        values.push(ticketData.assigned_developer_id);
      }
      // Add admin tracking columns
      if (ticketData.updated_by !== undefined) {
        updates.push(` updated_by = $${paramIndex++}`);
        values.push(ticketData.updated_by);
      }
      if (ticketData.update_date !== undefined) {
        updates.push(` update_date = $${paramIndex++}`);
        values.push(ticketData.update_date);
      }
      if (ticketData.assigned_by !== undefined) {
        updates.push(` assigned_by = $${paramIndex++}`);
        values.push(ticketData.assigned_by);
      }
      if (ticketData.assigned_date !== undefined) {
        updates.push(` assigned_date = $${paramIndex++}`);
        values.push(ticketData.assigned_date);
      }
      if (ticketData.closed_by !== undefined) {
        updates.push(` closed_by = $${paramIndex++}`);
        values.push(ticketData.closed_by);
      }
      if (ticketData.closed_date !== undefined) {
        updates.push(` closed_date = $${paramIndex++}`);
        values.push(ticketData.closed_date);
      }

      // If there are no updates, return the current ticket
      if (updates.length === 0) {
        return await this.getTicketById(ticketId);
      }

      query += updates.join(',');
      query += ` WHERE id = $${paramIndex++} RETURNING *`;
      values.push(ticketId);

      const result = await client.query(query, values);
      
      // Update topics if provided
      if (ticketData.topics && Array.isArray(ticketData.topics)) {
        // Remove existing relationships
        await client.query('DELETE FROM ticket_topic WHERE ticket_id = $1', [ticketId]);
        
        // Add the new relationships
        const getTopicIdsQuery = `SELECT id FROM topic WHERE name = ANY($1)`;
        const topicResult = await client.query(getTopicIdsQuery, [ticketData.topics]);
        const topicIds = topicResult.rows.map(row => row.id);

        for (const topicId of topicIds) {
          await client.query(
            'INSERT INTO ticket_topic (ticket_id, topic_id) VALUES ($1, $2)',
            [ticketId, topicId]
          );
        }
      }

      await client.query('COMMIT');
      return await this.getTicketById(ticketId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error updating ticket with ID ${ticketId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Deletes a ticket from the database
   * @param {number} ticketId - ID of the ticket to delete
   * @returns {Promise<boolean>} Operation result
   */
  async deleteTicket(ticketId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // First delete relationships in related tables
      await client.query('DELETE FROM ticket_topic WHERE ticket_id = $1', [ticketId]);
      await client.query('DELETE FROM comment WHERE ticket_id = $1', [ticketId]);
      
      // Then delete the ticket
      const result = await client.query('DELETE FROM ticket WHERE id = $1', [ticketId]);
      
      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error deleting ticket with ID ${ticketId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Retrieves a ticket's comments
   * @param {number} ticketId - Ticket ID
   * @returns {Promise<Array>} List of comments
   */
  async getTicketComments(ticketId) {
    try {
      const query = `
        SELECT c.*, 
               u.name as author_name, u.surname as author_surname
        FROM comment c
        JOIN users u ON c.author_id = u.id
        WHERE c.ticket_id = $1
        ORDER BY c.created_at DESC
      `;

      const { rows } = await db.query(query, [ticketId]);
      return rows;
    } catch (error) {
      console.error(`Error retrieving comments for ticket with ID ${ticketId}:`, error);
      throw error;
    }
  },

  /**
   * Adds a comment to a ticket
   * @param {Object} commentData - Data for the new comment
   * @returns {Promise<Object>} Created comment
   */
  async addComment(commentData) {
    try {
      const query = `
        INSERT INTO comment (comment_text, author_id, ticket_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const params = [
        commentData.comment_text,
        commentData.author_id,
        commentData.ticket_id
      ];

      const { rows } = await db.query(query, params);
      
      // Get the author details
      const authorQuery = `
        SELECT name, surname FROM users WHERE id = $1
      `;
      const authorResult = await db.query(authorQuery, [commentData.author_id]);
      
      // Combine the results
      if (authorResult.rows.length > 0) {
        rows[0].author_name = authorResult.rows[0].name;
        rows[0].author_surname = authorResult.rows[0].surname;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Creates a rating for a resolved ticket
   * @param {Object} ratingData - Data for the rating (ticket_id, rating, comment, rated_by)
   * @returns {Promise<Object>} Created rating
   */
  async createTicketRating(ratingData) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // Check if rating already exists for this ticket
      const checkQuery = `SELECT id FROM ticket_rating WHERE ticket_id = $1`;
      const checkResult = await client.query(checkQuery, [ratingData.ticket_id]);
      
      if (checkResult.rows.length > 0) {
        throw new Error('This ticket has already been rated');
      }
      
      // Insert rating
      const insertQuery = `
        INSERT INTO ticket_rating (ticket_id, rating, comment, rated_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const { rows } = await client.query(insertQuery, [
        ratingData.ticket_id,
        ratingData.rating,
        ratingData.comment || null,
        ratingData.rated_by
      ]);
      
      // Update ticket with rating_id
      await client.query(
        'UPDATE ticket SET rating_id = $1 WHERE id = $2',
        [rows[0].id, ratingData.ticket_id]
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating ticket rating:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Retrieves the rating for a ticket
   * @param {number} ticketId - Ticket ID
   * @returns {Promise<Object|null>} Rating object or null
   */
  async getTicketRating(ticketId) {
    try {
      const query = `
        SELECT tr.*
        FROM ticket_rating tr
        WHERE tr.ticket_id = $1
      `;
      
      const { rows } = await db.query(query, [ticketId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error retrieving rating for ticket ${ticketId}:`, error);
      throw error;
    }
  },

  /**
   * Awards points to a user (updates rank in userdb)
   * @param {number} userId - User ID
   * @param {number} points - Points to award
   * @returns {Promise<void>}
   */
  async awardPoints(userId, points) {
    try {
      const query = `
        UPDATE userdb.users
        SET rank = COALESCE(rank, 0) + $1
        WHERE id = $2
      `;
      
      await db.query(query, [points, userId]);
      console.log(`Awarded ${points} points to user ${userId}`);
    } catch (error) {
      console.error(`Error awarding points to user ${userId}:`, error);
      throw error;
    }
  }
};

module.exports = TicketModel;