const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Get a specific user by ID
router.get('/:userId', userController.getUserById);

// Update a user
router.put('/:userId', [
  body('email').optional().isEmail().withMessage('Must be a valid email'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['user', 'admin', 'technician']).withMessage('Invalid role')
], userController.updateUser);

// Delete a user
router.delete('/:userId', userController.deleteUser);

module.exports = router;