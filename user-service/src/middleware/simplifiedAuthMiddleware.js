// filepath: /var/home/antonino/Documents/github/fix-this-stuff-proj/user-service/src/middleware/authMiddleware.js
/**
 * Enhanced middleware that trusts headers set by the Spring Boot API Gateway
 * but also supports direct JWT validation as fallback
 */
const jwt = require('jsonwebtoken');

const authenticateRequest = (req, res, next) => {
  // First try to get user info from trusted headers (set by API Gateway)
  const userId = req.headers['x-user'];
  const role = req.headers['x-role'];
  const username = req.headers['x-username'];
  
  if (userId && role) {
    // Set user info from trusted headers
    req.user = { 
      id: parseInt(userId), // id come intero
      role: role,
      username: username || `user_${userId}`
    };
    return next();
  }
  
  // Fallback: try to validate JWT token directly
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized request - missing authentication' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username || decoded.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
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
 * Middleware to check if user has moderator role
 */
const authorizeModerator = (req, res, next) => {
  if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Requires moderator privileges' });
  }
  
  next();
};

module.exports = {
  authenticateRequest,
  authorizeAdmin,
  authorizeModerator
};
