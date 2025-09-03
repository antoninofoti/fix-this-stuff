const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route imports
const userRoutes = require('./routes/userRoutes');
const moderatorRoutes = require('./routes/moderatorRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userController = require('./controllers/userController');

// Authentication middleware
const { authenticateRequest } = require('./middleware/simplifiedAuthMiddleware');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Internal routes (no authentication required)
app.post('/api/users/internal/create', userController.internalCreateUser);
app.get('/api/users/internal/:userId', userController.internalGetUserById);

// Protected routes
app.use('/api/users', authenticateRequest, userRoutes);
app.use('/api/moderators', moderatorRoutes);
app.use('/api/roles', roleRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    // Import database module
    const db = require('./config/db');
    
    // Test database connection
    const result = await db.query('SELECT NOW()');
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'User service is running',
      database: {
        connected: true,
        timestamp: result.rows[0].now
      }
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'partial', 
      message: 'User service is running but database connection failed',
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to User Service API',
    endpoints: {
      health: '/api/health',
      users: '/api/users'
    }
  });
});

// 404 error handling
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Generic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'An internal error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`User service listening on port ${PORT}`);
});

module.exports = app;
