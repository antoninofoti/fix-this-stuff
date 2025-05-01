const TicketModel = require('../models/ticketModel');
const { validationResult } = require('express-validator');

/**
 * Controller for ticket management
 */
const TicketController = {
  /**
   * Gets all tickets
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAllTickets(req, res) {
    try {
      // Extract filter parameters from query string
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        solveStatus: req.query.solve_status,
        topic: req.query.topic,
        orderBy: req.query.order_by,
        orderDir: req.query.order_dir
      };

      // If the user is not a moderator, filter only tickets they own or are assigned to
      if (req.user.role !== 'moderator') {
        if (req.user.role === 'developer') {
          filters.developerId = req.user.id;
        } else {
          filters.authorId = req.user.id;
        }
      }

      const tickets = await TicketModel.getAllTickets(filters);
      res.status(200).json(tickets);
    } catch (error) {
      console.error('Error retrieving tickets:', error);
      res.status(500).json({ message: 'Error retrieving tickets', error: error.message });
    }
  },

  /**
   * Gets a ticket by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getTicketById(req, res) {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }

      const ticket = await TicketModel.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Permission check: only the owner, assigned developer, or a moderator can see the details
      if (
        req.user.role !== 'moderator' &&
        req.user.id !== ticket.request_author_id &&
        req.user.id !== ticket.assigned_developer_id
      ) {
        return res.status(403).json({ message: 'You do not have permission to view this ticket' });
      }

      res.status(200).json(ticket);
    } catch (error) {
      console.error(`Error retrieving ticket with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error retrieving ticket', error: error.message });
    }
  },

  /**
   * Creates a new ticket
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async createTicket(req, res) {
    try {
      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Make sure the current user is the ticket author
      const ticketData = {
        ...req.body,
        request_author_id: req.user.id, // Set the authenticated user as the author
        system_id: 1 // For now we use a fixed system_id, could be configurable
      };

      const newTicket = await TicketModel.createTicket(ticketData);
      res.status(201).json(newTicket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ message: 'Error creating ticket', error: error.message });
    }
  },

  /**
   * Updates an existing ticket
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async updateTicket(req, res) {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }

      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if the ticket exists
      const existingTicket = await TicketModel.getTicketById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Permission check
      if (req.user.role !== 'moderator') {
        // Only the owner can modify their own ticket
        if (existingTicket.request_author_id !== req.user.id) {
          return res.status(403).json({ message: 'You do not have permission to modify this ticket' });
        }
        
        // Normal users cannot modify certain fields
        if (req.body.assigned_developer_id || req.body.solve_status) {
          return res.status(403).json({ message: 'You do not have permission to modify these fields' });
        }
      }

      const updatedTicket = await TicketModel.updateTicket(ticketId, req.body);
      res.status(200).json(updatedTicket);
    } catch (error) {
      console.error(`Error updating ticket with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error updating ticket', error: error.message });
    }
  },

  /**
   * Deletes a ticket
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async deleteTicket(req, res) {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }

      // Check if the ticket exists
      const existingTicket = await TicketModel.getTicketById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Permission check: only the owner or a moderator can delete the ticket
      if (
        req.user.role !== 'moderator' &&
        req.user.id !== existingTicket.request_author_id
      ) {
        return res.status(403).json({ message: 'You do not have permission to delete this ticket' });
      }

      const deleted = await TicketModel.deleteTicket(ticketId);
      if (deleted) {
        res.status(200).json({ message: 'Ticket deleted successfully' });
      } else {
        res.status(500).json({ message: 'An error occurred while deleting the ticket' });
      }
    } catch (error) {
      console.error(`Error deleting ticket with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error deleting ticket', error: error.message });
    }
  },

  /**
   * Gets a ticket's comments
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getTicketComments(req, res) {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }

      // Check if the ticket exists
      const existingTicket = await TicketModel.getTicketById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Permission check: only users connected to the ticket can see the comments
      if (
        req.user.role !== 'moderator' &&
        req.user.id !== existingTicket.request_author_id &&
        req.user.id !== existingTicket.assigned_developer_id
      ) {
        return res.status(403).json({ message: 'You do not have permission to view comments for this ticket' });
      }

      const comments = await TicketModel.getTicketComments(ticketId);
      res.status(200).json(comments);
    } catch (error) {
      console.error(`Error retrieving comments for ticket with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error retrieving comments', error: error.message });
    }
  },

  /**
   * Adds a comment to a ticket
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async addComment(req, res) {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }

      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if the ticket exists
      const existingTicket = await TicketModel.getTicketById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Permission check: only users connected to the ticket can add comments
      if (
        req.user.role !== 'moderator' &&
        req.user.id !== existingTicket.request_author_id &&
        req.user.id !== existingTicket.assigned_developer_id
      ) {
        return res.status(403).json({ message: 'You do not have permission to comment on this ticket' });
      }

      const commentData = {
        comment_text: req.body.comment_text,
        author_id: req.user.id,
        ticket_id: ticketId
      };

      const newComment = await TicketModel.addComment(commentData);
      res.status(201).json(newComment);
    } catch (error) {
      console.error(`Error adding comment to ticket with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
  }
};

module.exports = TicketController;