const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const credentialController = require('../controllers/credentialController');
const { authenticateRequest } = require('../middleware/auth_Middleware');

// --- BEGIN DEBUG LOG ---
console.log('--- DEBUG: authRoutes.js ---');
console.log('typeof authController:', typeof authController);
if (authController) console.log('authController keys:', Object.keys(authController));
console.log('typeof credentialController:', typeof credentialController);
if (credentialController) console.log('credentialController keys:', Object.keys(credentialController));
console.log('typeof credentialController.getCredentialById:', typeof credentialController.getCredentialById);
// --- END DEBUG LOG ---

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'auth-service',
        timestamp: new Date().toISOString()
    });
});

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

// Verify token validity - used by other services
router.get('/verify-token', authenticateRequest, authController.verifyToken);

// Credential routes for microservice communication
router.get('/credentials/:credentialId', credentialController.getCredentialById);
router.get('/credentials/:credentialId/exists', credentialController.checkCredentialExists);

module.exports = router;