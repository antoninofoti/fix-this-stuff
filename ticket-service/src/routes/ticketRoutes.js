const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const { authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new ticket
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
], ticketController.createTicket);

// Get all tickets
router.get('/', ticketController.getAllTickets);

// Get a specific ticket
router.get('/:ticketId', ticketController.getTicketById);

// Update a ticket
router.put('/:ticketId', [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['open', 'in-progress', 'pending', 'resolved', 'closed']).withMessage('Invalid status'),
  body('assigned_to').optional().isInt().withMessage('Assigned to must be a user ID')
], ticketController.updateTicket);

// Delete a ticket
router.delete('/:ticketId', ticketController.deleteTicket);

module.exports = router;