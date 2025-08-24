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
 * Get a specific user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Admin can vedere tutti, developer/moderator solo il proprio profilo
    const allowedRoles = ['developer', 'moderator'];
    // Debug: log valori
    // console.log('userId param:', userId, 'req.user:', req.user);
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
 * Internal endpoint to create a user, called by auth-service
 */
const internalCreateUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role, credentialsId } = req.body;

    // Basic validation
    if (!email || !firstName || !lastName || !credentialsId) {
      return res.status(400).json({ message: 'Missing required fields for internal user creation' });
    }

    // Check if user already exists by email or credentialsId
    const existingByEmail = await userModel.findByEmail(email);
    if (existingByEmail) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // In a real scenario, you might want to check if a user with credentialsId already exists
    // if credentialsId is not the primary key or unique.
    // For now, we assume credentialsId will be unique or handled by DB constraints.

    const newUser = await userModel.create({
      email,
      firstName,
      lastName,
      role: role || 'user',
      credentialsId
    });

    // We don't typically return the full user object on internal calls,
    // but for confirmation, we can return the ID or a success message.
    res.status(201).json({
      message: 'User profile created successfully via internal call',
      userId: newUser.id,
      user: newUser // Returning the user object for now, can be trimmed later
    });

  } catch (error) {
    console.error('Error in internalCreateUser:', error);
    // If the error is due to a unique constraint violation (e.g., email already exists)
    // which might not be caught by the above check if there's a race condition.
    if (error.code === '23505') { // PostgreSQL unique violation error code
        return res.status(409).json({ message: 'User creation failed due to a conflict (e.g., email or credentialsId already exists).' });
    }
    res.status(500).json({ message: 'Server error during internal user creation' });
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

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  internalCreateUser, // Add new controller
  getUsersByRole,
  updateUserRole,
  getPrivilegedUsers
};