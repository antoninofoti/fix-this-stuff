const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const testUser = {
  name: 'Test',
  surname: 'User',
  email: 'testuser@example.com',
  password: 'TestPass123'
};

let authToken;

/**
 * Register a new user
 */
async function registerUser() {
  try {
    console.log('Registering a new user...');
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('Registration successful');
    console.log(response.data);
    return true;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message === 'User with this email already exists') {
      console.log('User already exists, proceeding to login');
      return true;
    }
    console.error('Registration failed:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Login with user credentials to get auth token
 */
async function loginUser() {
  try {
    console.log('Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = response.data.token;
    console.log('Login successful, received token');
    return true;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Test accessing tickets endpoint with auth token
 */
async function getTickets() {
  try {
    console.log('Accessing protected tickets endpoint...');
    const response = await axios.get(`${API_URL}/tickets`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('Successfully accessed tickets:');
    console.log(response.data);
  } catch (error) {
    console.error('Failed to access tickets:', error.response ? error.response.data : error.message);
  }
}

/**
 * Get user profile using auth token
 */
async function getUserProfile() {
  try {
    console.log('Accessing user profile...');
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('User profile data:');
    console.log(response.data);
  } catch (error) {
    console.error('Failed to access profile:', error.response ? error.response.data : error.message);
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('Starting authentication tests...');
  
  // Step 1: Register user (or confirm user exists)
  const registered = await registerUser();
  if (!registered) {
    console.error('Cannot proceed without registered user');
    return;
  }
  
  // Step 2: Login and get token
  const loggedIn = await loginUser();
  if (!loggedIn) {
    console.error('Cannot proceed without authentication token');
    return;
  }
  
  // Step 3: Test accessing user profile (protected route)
  await getUserProfile();
  
  // Step 4: Test accessing tickets (protected route)
  await getTickets();
  
  console.log('Authentication test completed!');
}

// Run the tests
runTests();