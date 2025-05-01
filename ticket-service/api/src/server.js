const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route imports
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Authentication middleware
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/tickets', authenticateToken, ticketRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Test route
app.get('/api/health', async (req, res) => {
  try {
    // Import database module
    const db = require('./config/db');
    
    // Test database connection
    const result = await db.query('SELECT NOW()');
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      database: {
        connected: true,
        timestamp: result.rows[0].now
      }
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'partial', 
      message: 'Server is running but database connection failed',
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
    message: 'Welcome to Ticket Service API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tickets: '/api/tickets',
      users: '/api/users'
    },
    documentation: 'See README.md for API documentation'
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
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app; // For tests