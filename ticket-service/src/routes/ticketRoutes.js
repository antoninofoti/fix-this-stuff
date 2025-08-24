const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
// Import the new API Gateway middleware
const { authenticateRequest, authorizeAdmin, authorizeModerator, authorizeDeveloper } = require('../middleware/apiGatewayMiddleware');

const router = express.Router();

// Create a new ticket - requires authentication
router.post('/', authenticateRequest, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category/system ID is required').isInt().withMessage('Category/system ID must be an integer'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority - must be low, medium, or high')
], ticketController.createTicket);

// Get all tickets - now requires authentication
router.get('/', authenticateRequest, ticketController.getAllTickets);

// Special route for admins/moderators to get all tickets with extended information
router.get('/admin/all', authenticateRequest, authorizeModerator, ticketController.getAllTicketsAdmin);

// Get a specific ticket - requires authentication
router.get('/:ticketId', authenticateRequest, ticketController.getTicketById);

// Update a ticket - requires authentication (users can only update their own tickets)
router.put('/:ticketId', authenticateRequest, [
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

// Delete a ticket - requires admin privileges
router.delete('/:ticketId', authenticateRequest, authorizeAdmin, ticketController.deleteTicket);

module.exports = router;