const systemModel = require('../models/systemModel');

/**
 * Get a system by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getSystemById = async (req, res) => {
  try {
    const { systemId } = req.params;
    
    // Validate input
    if (!systemId || isNaN(systemId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid system ID' 
      });
    }
    
    const system = await systemModel.getSystemById(systemId);
    
    if (!system) {
      return res.status(404).json({ 
        success: false, 
        message: 'System not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      system
    });
  } catch (error) {
    console.error('Error in getSystemById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if a system exists
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const checkSystemExists = async (req, res) => {
  try {
    const { systemId } = req.params;
    
    // Validate input
    if (!systemId || isNaN(systemId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid system ID' 
      });
    }
    
    const exists = await systemModel.exists(systemId);
    
    res.status(200).json({ 
      success: true,
      exists 
    });
  } catch (error) {
    console.error('Error in checkSystemExists:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all systems
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllSystems = async (req, res) => {
  try {
    const systems = await systemModel.getAllSystems();
    
    res.status(200).json({ 
      success: true,
      systems 
    });
  } catch (error) {
    console.error('Error in getAllSystems:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSystemById,
  checkSystemExists,
  getAllSystems
};
