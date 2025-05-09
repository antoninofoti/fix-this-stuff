const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserModel = require('../models/userModel');

/**
 * Controller for authentication management
 */
const AuthController = {
  /**
   * Registers a new user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async register(req, res) {
    try {
      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userData = {
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: req.body.password
      };

      const newUser = await UserModel.createUser(userData);
      res.status(201).json({
        message: 'User registered successfully',
        user: newUser
      });
    } catch (error) {
      if (error.message === 'Email already in use') {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Error during registration', error: error.message });
    }
  },

  /**
   * Logs in a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async login(req, res) {
    try {
      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await UserModel.verifyCredentials(email, password);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          role: 'user' // For now everyone is a normal user
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Error during login', error: error.message });
    }
  },

  /**
   * Verifies if a token is valid
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async verifyToken(req, res) {
    // Token has already been verified by the authenticateToken middleware
    res.status(200).json({ 
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  },

  /**
   * Gets the current user's data
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserModel.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error retrieving profile:', error);
      res.status(500).json({ message: 'Error retrieving profile', error: error.message });
    }
  }
};

module.exports = AuthController;