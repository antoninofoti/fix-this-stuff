const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');

/**
 * Get a list of all users
 */
const getAllUsers = async (req, res) => {
  try {
    // Only admin users should be able to get all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Requires admin privileges' });
    }
    
    const users = await userModel.findAll();
    
    // Remove passwords from the response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a specific user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users should only be able to see their own profile unless they are admins
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Insufficient permissions to access this resource' });
    }
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password before sending the response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a user
 */
const updateUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId } = req.params;
    
    // Users should only be able to update their own profile unless they are admins
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Insufficient permissions to update this resource' });
    }
    
    // Check if user exists
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Extract updateable fields
    const { firstName, lastName, email } = req.body;
    
    // Create update object with only valid fields
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    
    // If admin is updating, they can change the role
    if (req.user.role === 'admin' && req.body.role) {
      updates.role = req.body.role;
    }
    
    // Update the user
    const updatedUser = await userModel.update(userId, updates);
    
    // Remove password from the response
    delete updatedUser.password;
    
    res.status(200).json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a user
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only admins or the user themselves can delete a user
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Insufficient permissions to delete this resource' });
    }
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await userModel.remove(userId);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};