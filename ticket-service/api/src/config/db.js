const { Pool } = require('pg');
require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

// Create a PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database');
    release();
  }
});

// Database interface
module.exports = {
  /**
   * Executes a SQL query on the database
   * @param {string} text - The SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise} Query result
   */
  query: (text, params) => pool.query(text, params),
  
  /**
   * Gets a client from the pool for transactions
   * @returns {Promise<Object>} Database client
   */
  getClient: () => pool.connect(),
  
  /**
   * Returns the pool instance
   */
  pool
};