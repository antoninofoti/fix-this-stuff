const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const UserModel = require('../models/userModel');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Protected
 */
router.get('/', async (req, res) => {
  try {
    const users = await UserModel.getAllUsers(req.query);
    res.json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Protected
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await UserModel.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(`Error retrieving user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Protected (admin only)
 */
router.post('/', [
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('name').notEmpty().withMessage('Name is required'),
  check('surname').notEmpty().withMessage('Surname is required'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  check('role').isIn(['admin', 'developer', 'user']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    const newUser = await UserModel.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    if (error.message === 'Email already in use') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Protected (admin or self)
 */
router.put('/:id', [
  check('email').optional().isEmail().withMessage('Please provide a valid email'),
  check('name').optional().notEmpty().withMessage('Name cannot be empty'),
  check('surname').optional().notEmpty().withMessage('Surname cannot be empty'),
  check('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  check('role').optional().isIn(['admin', 'developer', 'user']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is admin or updating their own profile
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Only admin can change roles
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }

    const updatedUser = await UserModel.updateUser(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Protected (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }

    const result = await UserModel.deleteUser(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;