const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const credentialModel = require('../models/credentialModel'); // Changed from userModel to credentialModel
const axios = require('axios'); // For making HTTP requests to user-service

// Get user service URL from environment or use a default
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';

/**
 * Health check endpoint
 */
const health = async (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
};

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

    // Step 2: Use role from credentials table (now includes role column)
    let userRole = credential.role || 'developer'; // Use role from credentials or default
    let userId = credential.id;

    // Generate JWT token with user information
    const tokenPayload = {
      id: userId,
      credentialId: credential.id,
      username: credential.username,
      email: credential.username, // Email is stored as username
      role: userRole,
      iat: Math.floor(Date.now() / 1000) // Issued at time
    };
    
    // Debug JWT secret
    console.log("JWT Secret from environment:", process.env.JWT_SECRET);
    console.log("Using JWT key:", process.env.JWT_SECRET.substring(0, Math.min(10, process.env.JWT_SECRET.length)) + "...");
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: userId,
        credentialId: credential.id,
        email: credential.username,
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
  health,
  register,
  login,
  verifyToken,
  verifyTokenFromPost
};