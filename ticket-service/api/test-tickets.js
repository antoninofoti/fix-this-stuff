const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const testUser = {
  name: 'Test',
  surname: 'User',
  email: 'testuser@example.com',
  password: 'TestPass123'
};

const testTicket = {
  title: 'Test Ticket',
  priority: 'medium',
  deadline_date: '2025-06-01T12:00:00Z', // One month from now
  flag_status: 'open',
  solve_status: 'not_solved',
  request: 'This is a test ticket to verify the API functionality',
  system_id: 1 // Assuming system_id 1 exists
};

let authToken;
let createdTicketId;

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
 * Create a new ticket
 */
async function createTicket() {
  try {
    console.log('Creating a new ticket...');
    const response = await axios.post(
      `${API_URL}/tickets`,
      testTicket,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    console.log('Ticket created successfully:');
    console.log(response.data);
    
    // The API directly returns the ticket object, not wrapped in a 'ticket' property
    createdTicketId = response.data.id;
    return true;
  } catch (error) {
    console.error('Failed to create ticket:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Get all tickets
 */
async function getAllTickets() {
  try {
    console.log('Getting all tickets...');
    const response = await axios.get(
      `${API_URL}/tickets`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    console.log('All tickets:');
    console.log(response.data);
    return true;
  } catch (error) {
    console.error('Failed to get tickets:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Get a specific ticket by ID
 */
async function getTicketById() {
  if (!createdTicketId) {
    console.log('No ticket ID available. Skipping getTicketById test.');
    return false;
  }
  
  try {
    console.log(`Getting ticket with ID ${createdTicketId}...`);
    const response = await axios.get(
      `${API_URL}/tickets/${createdTicketId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    console.log('Ticket details:');
    console.log(response.data);
    return true;
  } catch (error) {
    console.error('Failed to get ticket by ID:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('Starting ticket tests...');
  
  // Step 1: Login to get token (assuming user exists from previous test)
  const loggedIn = await loginUser();
  if (!loggedIn) {
    console.error('Cannot proceed without authentication token');
    console.log('Please run test-auth.js first to create a test user');
    return;
  }
  
  // Step 2: Create a ticket
  const ticketCreated = await createTicket();
  if (!ticketCreated) {
    console.error('Failed to create a test ticket');
  }
  
  // Step 3: Get all tickets
  await getAllTickets();
  
  // Step 4: Get specific ticket by ID
  await getTicketById();
  
  console.log('Ticket tests completed!');
}

// Run the tests
runTests();