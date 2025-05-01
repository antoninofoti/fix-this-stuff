const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const { authenticateToken, isModerator, isResourceOwnerOrModerator } = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware for ticket creation/update validation
const validateTicket = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isString().withMessage('Title must be a string')
    .isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
  body('priority')
    .notEmpty().withMessage('Priority is required')
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('deadline_date')
    .optional()
    .isISO8601().withMessage('Deadline date must be a valid date'),
  body('request')
    .notEmpty().withMessage('Request is required')
    .isString().withMessage('Request must be a string'),
  body('topics')
    .optional()
    .isArray().withMessage('Topics must be an array')
];

// Middleware for comment validation
const validateComment = [
  body('comment_text')
    .notEmpty().withMessage('Comment text is required')
    .isString().withMessage('Comment text must be a string')
    .isLength({ min: 2, max: 1000 }).withMessage('Comment must be between 2 and 1000 characters')
];

// Get all tickets (filtered based on user role)
router.get('/', authenticateToken, ticketController.getAllTickets);

// Get a specific ticket by ID
router.get('/:id', authenticateToken, ticketController.getTicketById);

// Create a new ticket
router.post('/', authenticateToken, validateTicket, ticketController.createTicket);

// Update an existing ticket
router.put('/:id', authenticateToken, validateTicket, ticketController.updateTicket);

// Delete a ticket
router.delete('/:id', authenticateToken, ticketController.deleteTicket);

// Get a ticket's comments
router.get('/:id/comments', authenticateToken, ticketController.getTicketComments);

// Add a comment to a ticket
router.post('/:id/comments', authenticateToken, validateComment, ticketController.addComment);

module.exports = router;