const moderatorModel = require('../models/moderatorModel');
const { validationResult } = require('express-validator');

/**
 * Controller for moderator-related operations
 * 
 * Note: This functionality was migrated from the auth-service to consolidate
 * all user management in one service.
 */
const ModeratorController = {
  /**
   * Get a moderator by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getModeratorById(req, res) {
    try {
      const { moderatorId } = req.params;
      
      // Validate input
      if (!moderatorId || isNaN(moderatorId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid moderator ID' 
        });
      }
      
      const moderator = await moderatorModel.getModeratorById(moderatorId);
      
      if (!moderator) {
        return res.status(404).json({ 
          success: false, 
          message: 'Moderator not found' 
        });
      }
      
      res.status(200).json({ 
        success: true,
        moderator
      });
    } catch (error) {
      console.error('Error in getModeratorById:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Check if a moderator exists
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async checkModeratorExists(req, res) {
    try {
      const { moderatorId } = req.params;
      
      // Validate input
      if (!moderatorId || isNaN(moderatorId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid moderator ID' 
        });
      }
      
      const exists = await moderatorModel.exists(moderatorId);
      
      res.status(200).json({ 
        success: true,
        exists 
      });
    } catch (error) {
      console.error('Error in checkModeratorExists:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Get all moderators
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAllModerators(req, res) {
    try {
      const moderators = await moderatorModel.getAllModerators();
      
      res.status(200).json({ 
        success: true,
        moderators 
      });
    } catch (error) {
      console.error('Error in getAllModerators:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Create a new moderator
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async createModerator(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { name, surname, email, credentials_id } = req.body;
      
      const moderator = await moderatorModel.createModerator({
        name,
        surname,
        email,
        credentials_id
      });
      
      res.status(201).json({ 
        success: true,
        message: 'Moderator created successfully',
        moderator
      });
    } catch (error) {
      console.error('Error in createModerator:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Update a moderator
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async updateModerator(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { moderatorId } = req.params;
      const { name, surname, email } = req.body;
      
      // Validate input
      if (!moderatorId || isNaN(moderatorId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid moderator ID' 
        });
      }
      
      const moderator = await moderatorModel.updateModerator(moderatorId, {
        name,
        surname,
        email
      });
      
      if (!moderator) {
        return res.status(404).json({ 
          success: false, 
          message: 'Moderator not found' 
        });
      }
      
      res.status(200).json({ 
        success: true,
        message: 'Moderator updated successfully',
        moderator
      });
    } catch (error) {
      console.error('Error in updateModerator:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Delete a moderator
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async deleteModerator(req, res) {
    try {
      const { moderatorId } = req.params;
      
      // Validate input
      if (!moderatorId || isNaN(moderatorId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid moderator ID' 
        });
      }
      
      const deleted = await moderatorModel.deleteModerator(moderatorId);
      
      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          message: 'Moderator not found' 
        });
      }
      
      res.status(200).json({ 
        success: true,
        message: 'Moderator deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteModerator:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = ModeratorController;
