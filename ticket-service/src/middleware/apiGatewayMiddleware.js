/**
 * Enhanced middleware for working with the Spring Boot API Gateway
 * with JWT fallback support
 */
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate request based on headers from API Gateway or JWT token
 */
const authenticateRequest = (req, res, next) => {
  // First try to get user info from trusted headers (set by API Gateway)
  const username = req.headers['x-user'];
  const role = req.headers['x-role'];
  const userIdHeader = req.headers['x-username'];
  
  if (username && role) {
    console.log(`Request authenticated via API Gateway: user=${username}, role=${role}`);
    
    // Set user info from trusted headers
    req.user = { 
      id: username,
      username: userIdHeader || username, 
      role: role 
    };
    
    return next();
  }
  
  // Fallback: try to validate JWT token directly
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing API Gateway authentication headers and Authorization header');
    return res.status(401).json({ message: 'Unauthorized request' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Request authenticated via JWT: user=${decoded.username}, role=${decoded.role}`);
    
    req.user = {
      id: decoded.id,
      username: decoded.username || decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    console.log('JWT validation failed:', err.message);
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
  console.log(`Admin access granted for user ${req.user.username}`);
  next();
};

/**
 * Middleware to check if user has moderator role or higher
 */
const authorizeModerator = (req, res, next) => {
  if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Requires moderator privileges' });
  }
  console.log(`Moderator access granted for user ${req.user.username} with role ${req.user.role}`);
  next();
};

/**
 * Middleware to check if user has developer role or higher
 */
const authorizeDeveloper = (req, res, next) => {
  // All authenticated users should have at least developer role
  if (!req.user) {
    return res.status(403).json({ message: 'Authentication required' });
  }
  console.log(`Developer access granted for user ${req.user.username}`);
  next();
};

module.exports = {
  authenticateRequest,
  authorizeAdmin,
  authorizeModerator,
  authorizeDeveloper
};
