const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const credentialModel = require('../models/credentialModel'); // Changed from userModel to credentialModel
const axios = require('axios'); // For making HTTP requests to user-service

// Get user service URL from environment or use a default
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';

/**
 * User registration handler
 */
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Step 1: Check if credentials (username/email) already exist in auth-service
    const existingCredential = await credentialModel.getCredentialByUsername(email);
    if (existingCredential) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Step 2: Create credentials in auth-service
    const hashedPassword = await bcrypt.hash(password, 10);
    const newCredential = await credentialModel.createCredential(email, hashedPassword);

    // Step 3: Create user profile in user-service by calling its API
    try {
      const userResponse = await axios.post(`${USER_SERVICE_URL}/api/users/internal/create`, {
        email,
        firstName,
        lastName,
        role: role || 'developer', // Use 'developer' as default to match user schema
        credentialsId: newCredential.id // Pass the ID from the newly created credential
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse.data.user, // Return user data from user-service
        credentialId: newCredential.id
      });

    } catch (userServiceError) {
      // If user creation in user-service fails, we might need to roll back
      // the credential creation in auth-service or mark it as inactive.
      // For now, log the error and return a generic server error.
      console.error('Error creating user profile in user-service:', userServiceError.response ? userServiceError.response.data : userServiceError.message);
      // Attempt to delete the credential if user profile creation failed
      await credentialModel.deleteCredentialById(newCredential.id);
      return res.status(500).json({ message: 'Error during user profile creation. Registration rolled back.' });
    }

  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * User login handler
 */
const login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find the credential and verify password
    const credential = await credentialModel.getCredentialByUsername(email);
    if (!credential) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, credential.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Step 2: Fetch user details from user-service using credential_id (which should be user_id in user-service)
    // This assumes user-service has an endpoint to get user by credential_id or email.
    // For now, we'll just use the credential ID as the user ID for the token, 
    // and the client can fetch full profile from user-service.
    // A more robust solution would be to get the user's role from user-service here.
    
    // For now, we will assume the role is stored with the credential or is static for login purposes
    // In a real scenario, you'd fetch the role from the user-service based on credential.id
    // const userProfileResponse = await axios.get(`${USER_SERVICE_URL}/api/users/by-credential/${credential.id}`);
    // const userRole = userProfileResponse.data.user.role;
    const userRole = 'user'; // Placeholder: fetch actual role from user-service

    // Generate JWT token
    const token = jwt.sign(
      { id: credential.id, username: credential.username, role: userRole }, // Using username from credential, role needs to be fetched
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: credential.id, // This is the credential ID
        email: credential.username, // Email is the username here
        // firstName, lastName, and actual role should be fetched from user-service by the client if needed
        role: userRole 
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify token validity
 */
const verifyToken = (req, res) => {
  // If we got here, token is valid (middleware already checked)
  res.status(200).json({ 
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
};

/**
 * Verify a token sent via POST request (for microservice communication)
 */
const verifyTokenFromPost = (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ valid: false, message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(200).json({ valid: false, message: 'Invalid or expired token' });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  verifyTokenFromPost
};