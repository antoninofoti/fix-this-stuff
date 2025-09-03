const jwt = require('jsonwebtoken');

/**
 * Enhanced authentication middleware that supports both:
 * 1. JWT tokens (for direct API calls)
 * 2. Trusted headers from API Gateway (x-user, x-role)
 */
const authenticateRequest = (req, res, next) => {
  const internalAuthHeader = req.headers['x-internal-auth'];
  const userIdHeader = req.headers['x-user'];
  const roleHeader = req.headers['x-role'];
  const usernameHeader = req.headers['x-username'];

  if (internalAuthHeader === 'true') {
    // Request is coming from the API Gateway, trust the headers
    if (userIdHeader && roleHeader) {
      req.user = { 
        id: parseInt(userIdHeader),
        role: roleHeader,
        username: usernameHeader || userIdHeader
      };
      return next();
    }
  } else {
    // External request, do not trust x-user/x-role headers
    if (userIdHeader || roleHeader) {
        return res.status(403).json({ message: 'User and role headers are not allowed for direct requests.' });
    }
  }
  
  // Method 2: Check for JWT token in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username || decoded.email,
        credentialId: decoded.credentialId
      };
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }
  
  // No valid authentication found
  return res.status(401).json({ message: 'Unauthorized request - missing authentication' });
};

/**
 * Middleware to check if user has admin role
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Requires admin privileges' });
  }
  next();
};

/**
 * Middleware to check if user has moderator role or higher
 */
const authorizeModerator = (req, res, next) => {
  if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Requires moderator privileges' });
  }
  next();
};

/**
 * Middleware to check if user can access resource (own resource or admin)
 */
const authorizeOwnerOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.userId;
  
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Admin can access anything
  if (req.user.role === 'admin') {
    return next();
  }
  
  // User can only access their own resources
  if (String(req.user.id) === String(resourceUserId)) {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied' });
};

module.exports = {
  authenticateRequest,
  authorizeAdmin,
  authorizeModerator,
  authorizeOwnerOrAdmin
};
