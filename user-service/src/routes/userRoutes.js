const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
// Import the new simplified middleware
const { authenticateRequest, authorizeAdmin } = require('../middleware/simplifiedAuthMiddleware');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateRequest, authorizeAdmin, userController.getAllUsers);

// Get a specific user by ID
router.get('/:userId', authenticateRequest, userController.getUserById);

// Update a user
router.put('/:userId', authenticateRequest, [
  body('email').optional().isEmail().withMessage('Must be a valid email'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty')
  // Role changes must go through the dedicated roleRoutes endpoints
], userController.updateUser);

// Delete a user - requires admin privileges
router.delete('/:userId', authenticateRequest, authorizeAdmin, userController.deleteUser);

module.exports = router;