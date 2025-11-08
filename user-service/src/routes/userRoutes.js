const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
// Import the authentication middleware
const { authenticateRequest, authorizeAdmin, authorizeModerator, authorizeOwnerOrAdmin } = require('../middleware/simplifiedAuthMiddleware');

const router = express.Router();

// Internal endpoint to create user (no auth required - internal service call)
router.post('/internal/create', userController.createUserInternal);

// Internal endpoint to get user by ID (no auth required - internal service call)
router.get('/internal/:userId', userController.internalGetUserById);

// Internal endpoint to update user rank (no auth required - internal service call)
router.patch('/internal/:userId/rank', userController.updateUserRank);

// Internal endpoint to update user score (no auth required - internal service call)
router.patch('/internal/:userId/score', userController.updateUserScore);

// Get leaderboard (public endpoint - no authentication required)
router.get('/leaderboard', userController.getLeaderboard);

// Get all users (moderator or admin)
router.get('/', authenticateRequest, authorizeModerator, userController.getAllUsers);

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