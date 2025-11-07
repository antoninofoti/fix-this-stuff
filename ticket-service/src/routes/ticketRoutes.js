const express = require('express');
const { body } = require('express-validator');
const ticketController = require('../controllers/ticketController');
// Import the enhanced authentication middleware
const { authenticateRequest, optionalAuthentication, authorizeAdmin, authorizeModerator, authorizeAuthenticated, authorizeTicketAccess } = require('../middleware/enhancedAuthMiddleware');

const router = express.Router();

// Create a new ticket - all authenticated users can create tickets
router.post('/', authenticateRequest, authorizeAuthenticated, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category/system ID is required').isInt().withMessage('Category/system ID must be an integer'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority - must be low, medium, or high')
], ticketController.createTicket);

// Get all tickets - guests and authenticated users can view (filtered by role in controller)
router.get('/', optionalAuthentication, ticketController.getAllTickets);

// Special route for admins/moderators to get all tickets with extended information
router.get('/admin/all', authenticateRequest, authorizeModerator, ticketController.getAllTicketsAdmin);

// Get a specific ticket - guests and authenticated users can view (with proper filtering)
router.get('/:ticketId', optionalAuthentication, ticketController.getTicketById);

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

// NEW RESOLUTION WORKFLOW ROUTES

// Developer requests resolution approval
router.post('/:ticketId/request-resolution', authenticateRequest, authorizeAuthenticated, ticketController.requestResolution);

// Moderator/Admin approves resolution (awards points)
router.post('/:ticketId/approve-resolution', authenticateRequest, authorizeModerator, ticketController.approveResolution);

// Moderator/Admin rejects resolution
router.post('/:ticketId/reject-resolution', authenticateRequest, authorizeModerator, [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], ticketController.rejectResolution);

// Get tickets pending approval
router.get('/admin/pending-approval', authenticateRequest, authorizeModerator, ticketController.getPendingApprovalTickets);

// LEADERBOARD ROUTES

// Get leaderboard (public, shows only developers)
router.get('/leaderboard/top', ticketController.getLeaderboard);

// Get developer statistics
router.get('/developers/:developerId/stats', ticketController.getDeveloperStats);

// LEGACY WORKFLOW ROUTES (keeping for backward compatibility)

// Developer marks ticket as solved (awaiting approval)
router.post('/:ticketId/mark-solved', authenticateRequest, authorizeAuthenticated, ticketController.markAsSolved);

// Moderator/Admin approves solution and closes ticket (awards points)
router.post('/:ticketId/approve-and-close', authenticateRequest, authorizeModerator, [
  body('score').optional().isInt({ min: 1 }).withMessage('Score must be a positive integer')
], ticketController.approveAndClose);

// Moderator/Admin rejects solution and reopens
router.post('/:ticketId/reject-solution', authenticateRequest, authorizeModerator, [
  body('reason').optional().isString().withMessage('Reason must be a string')
], ticketController.rejectSolution);

// Moderator/Admin closes ticket without solution
router.post('/:ticketId/close-unsolved', authenticateRequest, authorizeModerator, [
  body('reason').optional().isString().withMessage('Reason must be a string')
], ticketController.closeUnsolved);

module.exports = router;