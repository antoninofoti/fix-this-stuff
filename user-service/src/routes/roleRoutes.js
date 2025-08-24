const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateRequest, authorizeAdmin } = require('../middleware/simplifiedAuthMiddleware');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticateRequest);
router.use(authorizeAdmin);

// Get all users by role
router.get('/users/:role', userController.getUsersByRole);

// Update a user's role (admin only)
router.put('/users/:userId/role', [
  body('role').isIn(['developer', 'moderator', 'admin']).withMessage('Invalid role')
], userController.updateUserRole);

// Get all users with elevated privileges (admin and moderators)
router.get('/privileged', userController.getPrivilegedUsers);

module.exports = router;
