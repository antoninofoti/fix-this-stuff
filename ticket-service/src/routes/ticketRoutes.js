const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
// Import the enhanced authentication middleware
const { authenticateRequest, authorizeAdmin, authorizeModerator, authorizeAuthenticated, authorizeTicketAccess } = require('../middleware/enhancedAuthMiddleware');

const router = express.Router();

// Create a new ticket - all authenticated users can create tickets
router.post('/', authenticateRequest, authorizeAuthenticated, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category/system ID is required').isInt().withMessage('Category/system ID must be an integer'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority - must be low, medium, or high')
], ticketController.createTicket);

// Get all tickets - all authenticated users (filtered by role in controller)
router.get('/', authenticateRequest, authorizeAuthenticated, ticketController.getAllTickets);

// Special route for admins/moderators to get all tickets with extended information
router.get('/admin/all', authenticateRequest, authorizeModerator, ticketController.getAllTicketsAdmin);

// Get a specific ticket - requires authentication and proper access
router.get('/:ticketId', authenticateRequest, authorizeTicketAccess, ticketController.getTicketById);

// Update a ticket - requires authentication and proper access
router.put('/:ticketId', authenticateRequest, authorizeTicketAccess, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
], ticketController.updateTicket);

// Admin update for ticket - requires moderator or admin privileges
router.put('/:ticketId/admin', authenticateRequest, authorizeModerator, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('flag_status').optional().isIn(['open', 'closed']).withMessage('Invalid status'),
  body('solve_status').optional().isIn(['solved', 'not_solved']).withMessage('Invalid solve status'),
  body('assigned_developer_id').optional().isInt().withMessage('Assigned developer ID must be an integer')
], ticketController.updateTicketAdmin);

// Delete a ticket - requires moderator or admin privileges
router.delete('/:ticketId', authenticateRequest, authorizeModerator, ticketController.deleteTicket);

// Rate a ticket - requires authentication and must be the ticket requester
router.post('/:ticketId/rating', authenticateRequest, authorizeAuthenticated, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('Comment must be a string')
], ticketController.rateTicket);

// Get rating for a ticket
router.get('/:ticketId/rating', ticketController.getTicketRating);

module.exports = router;