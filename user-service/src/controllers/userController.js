const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');

/*
 Get a list of all users. (needs jwt token) + x-user and x-role
 */
const getAllUsers = async (req, res) => {
  try {
    // Only admin users should be able to get all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Requires admin privileges' });
    }
    
    const users = await userModel.getAllUsers();
    
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
 * Get user by credential ID (internal endpoint)
 */
const getUserByCredentialId = async (req, res) => {
  try {
    const { credentialId } = req.params;
    
    const user = await userModel.getUserByCredentialId(credentialId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password before sending the response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error in getUserByCredentialId:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create user (internal endpoint - called by auth-service)
 */
const createUserInternal = async (req, res) => {
  try {
    const { email, firstName, lastName, role, credentialsId } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !credentialsId) {
      return res.status(400).json({ 
        message: 'Missing required fields: email, firstName, lastName, credentialsId' 
      });
    }
    
    const userData = {
      email,
      firstName,
      lastName,
      role: role || 'developer',
      credentialsId
    };
    
    const newUser = await userModel.createUser(userData);
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error in createUserInternal:', error);
    
    // Handle specific error types
    if (error.code === 'DUPLICATE_EMAIL') {
      return res.status(409).json({ 
        message: 'User with this email already exists',
        code: 'DUPLICATE_EMAIL'
      });
    }
    
    if (error.code === 'DUPLICATE_CREDENTIALS') {
      return res.status(409).json({ 
        message: 'User with these credentials already exists',
        code: 'DUPLICATE_CREDENTIALS'
      });
    }
    
    // Handle PostgreSQL unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({ 
        message: 'User already exists',
        code: 'DUPLICATE_USER'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during user creation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Admin can vedere tutti, developer/moderator solo il proprio profilo
    const allowedRoles = ['developer', 'moderator'];
    
    if (req.user.role === 'admin') {
      // admin: access granted
    } else if (
      allowedRoles.includes(req.user.role)
      && (String(req.user.id) === String(userId) || Number(req.user.id) === Number(userId))
    ) {
      // developer/moderator: può vedere solo il proprio profilo
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await userModel.getUserById(userId);
    console.log('Risultato getUserById:', user); // LOG AGGIUNTO
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
    const existingUser = await userModel.getUserById(userId);
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
    
    // SECURITY: Role changes must go through the dedicated updateUserRole method
    // which has proper validation and authorization checks
    
    // Update the user - explicitly NOT passing role
    const updatedUser = await userModel.updateUser(userId, updates);
    
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

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
  await userModel.delete(userId);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get users by specific role. Needs x-user and x-role headers.
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    if (!['developer', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }
    
    const users = await userModel.getAllUsers({ role });
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error in getUsersByRole:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a user's role - Admin only
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    // Only admins can change roles
    if (req.user.role !== 'admin') {
      console.warn(`Unauthorized attempt to change role by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({ message: 'Only administrators can modify user roles' });
    }
    // Use the secure updateUserRole method that includes all validation
    try {
      const updatedUser = await userModel.updateUserRole(userId, role, req.user.id);
      res.status(200).json({ 
        message: 'User role updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('DETAILED ERROR in updateUserRole:', error);
      if (error.message && error.message.includes('default administrator')) {
        return res.status(403).json({ message: error.message });
      } else if (error.message && error.message.includes('not found')) {
        return res.status(404).json({ message: 'User not found' });
      } else if (error.message && error.message.includes('Invalid role')) {
        return res.status(400).json({ message: error.message });
      } else {
        throw error; // Re-throw for the catch block below to handle
      }
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get all users with elevated privileges (admin and moderator)
 */
const getPrivilegedUsers = async (req, res) => {
  try {
    // Get all admins
    const admins = await userModel.getAllUsers({ role: 'admin' });
    
    // Get all moderators
    const moderators = await userModel.getAllUsers({ role: 'moderator' });
    
    res.status(200).json({
      privileged_users: {
        admins,
        moderators,
        total: admins.length + moderators.length
      }
    });
  } catch (error) {
    console.error('Error getting privileged users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Internal endpoint to get user by ID (no authentication required - for service-to-service calls)
 */
const internalGetUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password before sending the response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error in internalGetUserById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Internal endpoint to update user rank based on ticket rating
 */
const updateUserRank = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user rank - increment by rating value
    const currentRank = user.rank || 0;
    const newRank = currentRank + rating;
    
    await userModel.updateUserRank(userId, newRank);
    
    res.status(200).json({ 
      message: 'User rank updated successfully',
      userId,
      previousRank: currentRank,
      newRank,
      ratingReceived: rating
    });
  } catch (error) {
    console.error('Error in updateUserRank:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Internal endpoint to update user score based on ticket resolution
 */
const updateUserScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    
    // Validate points
    if (points === undefined || points === null) {
      return res.status(400).json({ message: 'Points value is required' });
    }
    
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user score - increment by points
    const currentScore = user.rank || 0; // Using 'rank' field as score
    const newScore = currentScore + points;
    
    await userModel.updateUserRank(userId, newScore);
    
    res.status(200).json({ 
      message: 'User score updated successfully',
      userId,
      previousScore: currentScore,
      newScore,
      pointsAwarded: points
    });
  } catch (error) {
    console.error('Error in updateUserScore:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get leaderboard of users by rank
 */
const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Limit must be between 1 and 100' });
    }
    
    const leaderboard = await userModel.getLeaderboard(limit);
    
    // Add position to each user
    const leaderboardWithPosition = leaderboard.map((user, index) => ({
      position: index + 1,
      ...user
    }));
    
    res.status(200).json({ 
      leaderboard: leaderboardWithPosition,
      count: leaderboard.length
    });
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByCredentialId,
  createUserInternal,
  updateUser,
  deleteUser,
  createUserInternal, // Internal endpoint for user creation
  internalGetUserById, // Add internal getUserById
  getUsersByRole,
  updateUserRole,
  getPrivilegedUsers,
  updateUserRank,
  updateUserScore,
  getLeaderboard
};