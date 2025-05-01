# Fix This Stuff - Ticket Management System

A microservice for support ticket management that allows users to create, view, modify, and delete tickets. The system includes authentication and authorization to protect resources.

## Project Structure

- `ticket-service/`: Service for ticket management
  - `api/`: REST API for interacting with the database
  - `docker-compose.yml`: Docker configuration for PostgreSQL and pgAdmin
  - `fixthisstuff.sql`: Database schema
  - `example_init_db.sql`: Example data to initialize the database

## Technologies Used

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker and Docker Compose

## Main Features

- User authentication (login/registration)
- Creating, viewing, modifying, and deleting tickets
- Filtering and sorting tickets
- Adding comments to tickets
- Role-based and ownership-based resource protection

## Development Environment Setup

### Prerequisites

- Node.js
- Docker and Docker Compose
- npm

### Local Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/fix-this-stuff.git
   cd fix-this-stuff
   ```

2. Start the database with Docker:
   ```bash
   cd ticket-service
   docker-compose up -d
   ```

3. Install API dependencies:
   ```bash
   cd api
   npm install
   ```

4. Create a `.env` file based on `.env.example`

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`.

To access to pgAdmin, the service is available at `http://localhost:8000`.

## API Structure

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token validity
- `GET /api/auth/profile` - Get the current user's profile

### Tickets

- `GET /api/tickets` - Get all tickets (filterable)
- `GET /api/tickets/:id` - Get a specific ticket
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/:id` - Update an existing ticket
- `DELETE /api/tickets/:id` - Delete a ticket

### Comments

- `GET /api/tickets/:id/comments` - Get a ticket's comments
- `POST /api/tickets/:id/comments` - Add a comment to a ticket

## Security

The system implements various security measures:

1. **JWT Authentication**: Each request to protected APIs requires a valid JWT token
2. **Prepared Statements**: All SQL queries use prepared statements to prevent SQL injection
3. **Input Validation**: All inputs are validated before processing
4. **Role-based Authorization**: Users can access only authorized resources
5. **Password Hashing**: Passwords are stored with secure hashing (bcrypt)

