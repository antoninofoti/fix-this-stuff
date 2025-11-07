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
        username: usernameHeader || userIdHeader,
        role: roleHeader
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
        username: decoded.username || decoded.email,
        role: decoded.role,
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
 * Middleware for optional authentication - allows both authenticated and guest access
 */
const optionalAuthentication = (req, res, next) => {
  const internalAuthHeader = req.headers['x-internal-auth'];
  const userIdHeader = req.headers['x-user'];
  const roleHeader = req.headers['x-role'];
  const usernameHeader = req.headers['x-username'];

  if (internalAuthHeader === 'true') {
    // Request is coming from the API Gateway, trust the headers
    if (userIdHeader && roleHeader) {
      req.user = { 
        id: parseInt(userIdHeader),
        username: usernameHeader || userIdHeader,
        role: roleHeader
      };
      return next();
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
        username: decoded.username || decoded.email,
        role: decoded.role,
        credentialId: decoded.credentialId
      };
      return next();
    } catch (err) {
      // Continue as guest
    }
  }
  
  // No authentication found, but allow as guest
  req.user = null;
  next();
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
 * Middleware to check if user can access ticket (owner, assignee, or moderator+)
 */
const authorizeTicketAccess = (req, res, next) => {
  // This will need to be enhanced to check ticket ownership
  // For now, allow developers to access their own tickets, moderators+ can access all
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Admin and moderators can access all tickets
  if (req.user.role === 'admin' || req.user.role === 'moderator') {
    return next();
  }
  
  // For developers, we'll need to check ticket ownership in the controller
  // For now, allow access and let the controller handle the logic
  next();
};

/**
 * Middleware to check if user has any authenticated role (developer, moderator, admin)
 */
const authorizeAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Allow all authenticated users (developer, moderator, admin)
  const allowedRoles = ['developer', 'moderator', 'admin'];
  if (allowedRoles.includes(req.user.role)) {
    return next();
  }
  
  return res.status(403).json({ message: 'Requires valid user role' });
};

module.exports = {
  authenticateRequest,
  optionalAuthentication,
  authorizeAdmin,
  authorizeModerator,
  authorizeAuthenticated,
  authorizeTicketAccess
};
