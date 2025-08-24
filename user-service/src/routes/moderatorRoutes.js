const express = require('express');
const { body } = require('express-validator');
const moderatorController = require('../controllers/moderatorController');
// Import the new simplified middleware
const { authenticateRequest, authorizeModerator } = require('../middleware/simplifiedAuthMiddleware');

const router = express.Router();

// Get all moderators - requires authentication
router.get('/', authenticateRequest, authorizeModerator, moderatorController.getAllModerators);

// Get a specific moderator by ID - requires authentication
router.get('/:moderatorId', authenticateRequest, authorizeModerator, moderatorController.getModeratorById);

// Check if a moderator exists
router.get('/:moderatorId/exists', authenticateRequest, authorizeModerator, moderatorController.checkModeratorExists);

// Create a new moderator
router.post('/', [
  authenticateRequest,
  authorizeModerator,
  body('name').notEmpty().withMessage('Name is required'),
  body('surname').notEmpty().withMessage('Surname is required'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('credentials_id').isInt().withMessage('Credentials ID must be an integer')
], moderatorController.createModerator);

// Update a moderator
router.put('/:moderatorId', [
  authenticateRequest,
  authorizeModerator,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('surname').optional().notEmpty().withMessage('Surname cannot be empty'),
  body('email').optional().isEmail().withMessage('Must be a valid email')
], moderatorController.updateModerator);

// Delete a moderator
router.delete('/:moderatorId', authenticateRequest, authorizeModerator, moderatorController.deleteModerator);

module.exports = router;
