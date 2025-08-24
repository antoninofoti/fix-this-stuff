const credentialModel = require('../models/credentialModel');

const getCredentialById = async (req, res) => {
  try {
    const { credentialId } = req.params;
    
    // Validate input
    if (!credentialId || isNaN(credentialId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credential ID' 
      });
    }
    
    const credential = await credentialModel.getCredentialById(credentialId);
    
    if (!credential) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credential not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      credentials: credential 
    });
  } catch (error) {
    console.error('Error in getCredentialById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
  
const checkCredentialExists = async (req, res) => {
  try {
    const { credentialId } = req.params;
    
    // Validate input
    if (!credentialId || isNaN(credentialId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credential ID' 
      });
    }
    
    const exists = await credentialModel.exists(credentialId);
    
    res.status(200).json({ 
      success: true,
      exists 
    });
  } catch (error) {
    console.error('Error in checkCredentialExists:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getCredentialById,
  checkCredentialExists
};
