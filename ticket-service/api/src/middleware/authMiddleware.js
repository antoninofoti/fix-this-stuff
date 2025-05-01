const jwt = require('jsonwebtoken');

/**
 * Middleware for authentication and authorization
 */
const authMiddleware = {
  /**
   * Verifies the user's JWT token
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. Token not provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }

      req.user = user;
      next();
    });
  },

  /**
   * Verifies if the user is a moderator
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  isModerator(req, res, next) {
    if (req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied. Moderator privileges required.' });
    }
    next();
  },

  /**
   * Verifies if the user is the resource owner or a moderator
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   * @param {string} resourceIdParam - Name of the parameter containing the resource ID
   * @param {string} resourceType - Type of resource (e.g., 'ticket', 'comment')
   * @param {Function} getResourceFn - Function to get the resource from the database
   */
  isResourceOwnerOrModerator(resourceIdParam, resourceType, getResourceFn) {
    return async (req, res, next) => {
      try {
        // If the user is a moderator, allow access
        if (req.user.role === 'moderator') {
          return next();
        }

        const resourceId = parseInt(req.params[resourceIdParam]);
        if (isNaN(resourceId)) {
          return res.status(400).json({ message: `Invalid ${resourceType} ID` });
        }

        const resource = await getResourceFn(resourceId);
        if (!resource) {
          return res.status(404).json({ message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found` });
        }

        // Check if the user is the resource owner
        if (resource.request_author_id !== req.user.id) {
          return res.status(403).json({ message: `You do not have permission to access this ${resourceType}` });
        }

        next();
      } catch (error) {
        console.error(`Error verifying permissions for ${resourceType}:`, error);
        res.status(500).json({ message: 'Error verifying permissions', error: error.message });
      }
    };
  }
};

module.exports = authMiddleware;