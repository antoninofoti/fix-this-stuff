const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// User registration
router.post('/register', [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
], authController.register);

// User login
router.post('/login', [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

// Get user profile - protected route
router.get('/profile', authenticateToken, authController.getProfile);

// Verify token validity - used by other services
router.get('/verify-token', authenticateToken, authController.verifyToken);

// Verify token validity - POST endpoint for microservices
router.post('/verify-token', authController.verifyTokenFromPost);

module.exports = router;