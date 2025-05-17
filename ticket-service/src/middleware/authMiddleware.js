const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Middleware to authenticate JWT token by verifying with the Auth Service
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ message: 'Authentication token required' });
  }

  console.log('Token found:', token.substring(0, 10) + '...');
  console.log('JWT_SECRET first 10 chars:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) : 'undefined');
  
  try {
    // Try to verify token locally first
    try {
      console.log('Attempting local token verification');
      const payload = jwt.decode(token);
      console.log('Token payload (decoded, not verified):', payload);
      
      const user = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Local token verification successful');
      req.user = user;
      return next();
    } catch (localErr) {
      console.log('Local token verification failed, error:', localErr.message);
      
      // If local verification fails, try to verify with auth service
      // First try Docker service discovery URL, then fallback to localhost if that fails
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      console.log('Primary auth service URL:', authServiceUrl);
      
      try {
        console.log('Sending token to auth service for verification...');
        let response;
        
        try {
          // Try the configured URL first (Docker or configured URL)
          response = await axios.post(`${authServiceUrl}/api/auth/verify-token`, { token });
        } catch (primaryUrlErr) {
          // If that fails, try localhost as fallback for local development
          console.log('Primary URL failed, trying localhost fallback...');
          response = await axios.post('http://localhost:3001/api/auth/verify-token', { token });
        }
        
        console.log('Auth service response:', response.data);
        
        if (response.data && response.data.valid) {
          console.log('Auth service token verification successful');
          req.user = response.data.user;
          return next();
        } else {
          console.log('Auth service reported token is invalid');
          return res.status(403).json({ message: 'Invalid or expired token' });
        }
      } catch (axiosErr) {
        console.error('Error communicating with auth service:', axiosErr.message);
        if (axiosErr.response) {
          console.log('Auth service responded with status:', axiosErr.response.status);
          console.log('Auth service response data:', axiosErr.response.data);
        }
        return res.status(500).json({ 
          message: 'Authentication service unavailable',
          error: process.env.NODE_ENV === 'development' ? axiosErr.message : undefined
        });
      }
    }
  } catch (err) {
    console.error('Unexpected error during authentication:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
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

module.exports = {
  authenticateToken,
  authorizeAdmin
};