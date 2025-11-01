const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route imports
const ticketRoutes = require('./routes/ticketRoutes');

// Authentication middleware

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Routes - authentication is handled at the route level
app.use('/tickets', ticketRoutes);

// Health check route
app.get('/health', async (req, res) => {
  try {
    // Import database module
    const db = require('./config/db');
    
    // Test database connection
    const result = await db.query('SELECT NOW()');
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Ticket service is running',
      database: {
        connected: true,
        timestamp: result.rows[0].now
      }
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'partial', 
      message: 'Ticket service is running but database connection failed',
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
      tickets: '/api/tickets'
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
  console.log(`Ticket service listening on port ${PORT}`);
});

module.exports = app;
