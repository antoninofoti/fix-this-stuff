const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
// Import the enhanced authentication middleware
const { authenticateRequest, authorizeAdmin, authorizeOwnerOrAdmin } = require('../middleware/enhancedAuthMiddleware');

const router = express.Router();

// Internal endpoint to create user (no auth required - internal service call)
router.post('/internal/create', userController.createUserInternal);

// Get all users (admin only)
router.get('/', authenticateRequest, authorizeAdmin, userController.getAllUsers);

// Get a specific user by ID (admin or owner)
router.get('/:userId', authenticateRequest, authorizeOwnerOrAdmin, userController.getUserById);

// Update a user (admin or owner)
router.put('/:userId', authenticateRequest, authorizeOwnerOrAdmin, [
  body('email').optional().isEmail().withMessage('Must be a valid email'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty')
  // Role changes must go through the dedicated roleRoutes endpoints
], userController.updateUser);

// Delete a user - requires admin privileges
router.delete('/:userId', authenticateRequest, authorizeAdmin, userController.deleteUser);

module.exports = router;