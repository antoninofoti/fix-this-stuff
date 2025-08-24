/**
 * New middleware for working with the Spring Boot API Gateway
 */

/**
 * Middleware to authenticate request based on headers from API Gateway
 */
const authenticateRequest = (req, res, next) => {
  const username = req.headers['x-user'];
  const role = req.headers['x-role'];
  
  if (!username || !role) {
    console.log('Missing API Gateway authentication headers');
    return res.status(401).json({ message: 'Unauthorized request' });
  }
  
  console.log(`Request authenticated via API Gateway: user=${username}, role=${role}`);
  
  // Set user info from trusted headers
  req.user = { 
    username: username, 
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
