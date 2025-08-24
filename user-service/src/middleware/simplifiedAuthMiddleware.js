// filepath: /var/home/antonino/Documents/github/fix-this-stuff-proj/user-service/src/middleware/authMiddleware.js
/**
 * Simplified middleware that trusts headers set by the Spring Boot API Gateway
 * instead of performing token validation directly
 */
const authenticateRequest = (req, res, next) => {
  const userId = req.headers['x-user'];
  const role = req.headers['x-role'];
  
  if (!userId || !role) {
    return res.status(401).json({ message: 'Unauthorized request' });
  }
  
  // Set user info from trusted headers
  req.user = { 
    id: parseInt(userId), // id come intero
    role: role 
  };
  
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
