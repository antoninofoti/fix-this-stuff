# Fix This Stuff# Fix This Stuff - Ticket Management System



A full-stack ticketing system for managing technical support requests with role-based access control, real-time notifications, and gamification features.A comprehensive microservices-based platform for managing technical support tickets, developer resources, and collaborative problem-solving.



## Overview## Table of Contents



Fix This Stuff is a microservices-based ticketing platform designed for organizations to manage technical support requests efficiently. The system features a point-based leaderboard to encourage developer participation, a resolution approval workflow, and comprehensive user management.- [Overview](#overview)

- [Architecture](#architecture)

## Key Features- [Services](#services)

- [Authentication & Security](#authentication--security)

- **Ticket Management**: Create, update, assign, and track technical support tickets- [Getting Started](#getting-started)

- **Role-Based Access Control**: Three-tier permission system (Developer, Moderator, Admin)- [API Documentation](#api-documentation)

- **Resolution Workflow**: Developer-submitted solutions require moderator approval- [Development Guide](#development-guide)

- **Gamification**: Point-based leaderboard system to encourage participation- [Troubleshooting](#troubleshooting)

- **Real-Time Updates**: RabbitMQ-powered notifications for ticket updates- [Project Status](#project-status)

- **Search Functionality**: Fast server-side search for tickets and users

- **Rating System**: Ticket requesters can rate resolved tickets## Overview



## Technology StackFix This Stuff is a modern ticket management system built with a microservices architecture, featuring:



### Backend- JWT-based authentication with role-based access control

- **API Gateway**: Java Spring Boot 3.3.5- Real-time comment system using RabbitMQ event streaming

- **Microservices**: Node.js (Express)- RESTful API Gateway for centralized routing and security

  - Authentication Service- Containerized deployment with Docker Compose

  - User Service- Vue.js frontend with responsive UI

  - Ticket Service

- **Comments Service**: Python Flask with RabbitMQ consumer## Architecture

- **Database**: PostgreSQL 16 (multi-database architecture)

- **Message Queue**: RabbitMQ 3.13### System Components



### Frontend```

- **Framework**: Vue 3 (Composition API)┌─────────────┐     ┌──────────────┐     ┌─────────────────┐

- **State Management**: Pinia│  Frontend   │────>│ API Gateway  │────>│  Microservices  │

- **HTTP Client**: Axios│  (Vue.js)   │     │ (Spring Boot)│     │   (Node.js)     │

- **UI Framework**: Bootstrap 5└─────────────┘     └──────────────┘     └─────────────────┘

- **Build Tool**: Vite                           │                       │

                           v                       v

## Architecture                    ┌──────────────┐      ┌──────────────┐

                    │  AuthFilter  │      │  PostgreSQL  │

The system follows a microservices architecture with the following components:                    │  (JWT Verify)│      │  (Databases) │

                    └──────────────┘      └──────────────┘

- **API Gateway** (Port 8081): Single entry point, handles routing and CORS```

- **Auth Service** (Port 3001): User authentication and credential management

- **User Service** (Port 3002): User profiles, roles, and permissions### Microservices Architecture

- **Ticket Service** (Port 3003): Ticket CRUD operations and business logic

- **Comment API** (Port 5003): Comment management with FlaskThe application follows a microservices pattern with service isolation:

- **Comments Consumer**: RabbitMQ consumer for asynchronous processing

- **PostgreSQL**: Three separate databases (authdb, userdb, ticketdb)- **Separate databases** per service (authdb, userdb, ticketdb)

- **RabbitMQ**: Message queue for notifications and events- **API Gateway** for request routing and authentication

- **Frontend** (Port 80): Vue.js SPA served by Nginx- **Service-to-service communication** via REST APIs

- **Event-driven comments** using RabbitMQ message broker

## Quick Start

### Technology Stack

### Prerequisites

#### Backend

- Docker 20.10+- **API Gateway**: Spring Boot (Java), port 8081

- Docker Compose 2.0+- **Auth Service**: Node.js/Express, port 3001

- **User Service**: Node.js/Express, port 3002

### Installation- **Ticket Service**: Node.js/Express, port 3003

- **Comment API**: Python/Flask, port 5003

1. Clone the repository:- **Comments Consumer**: Python (RabbitMQ consumer)

```bash

git clone https://github.com/antoninofoti/fix-this-stuff.git#### Infrastructure

cd fix-this-stuff- **Database**: PostgreSQL (separate databases per service)

```- **Message Broker**: RabbitMQ

- **Reverse Proxy**: Nginx (for frontend)

2. Start all services:- **Container Orchestration**: Docker Compose

```bash

docker compose up -d#### Frontend

```- **Framework**: Vue.js 3 with Composition API

- **State Management**: Pinia

3. Wait for services to initialize (approximately 30 seconds)- **Routing**: Vue Router

- **HTTP Client**: Axios

4. Access the application:- **UI Framework**: Bootstrap 5

   - Frontend: http://localhost- **Build Tool**: Vite

   - API Gateway: http://localhost:8081

   - PgAdmin: http://localhost:8080## Services



### Default Credentials### Auth Service (Port 3001)



**Admin Account:**Handles authentication and credential management.

- Email: `admin@fixthisstuff.com`

- Password: `admin123`**Responsibilities:**

- User registration and login

**PgAdmin:**- JWT token generation and verification

- Email: `admin@admin.com`- Credential storage and validation

- Password: `admin`- Password hashing with bcrypt



## Documentation**Database**: `authdb`

- Table: `credentials` (id, username, password, created_at)

Comprehensive documentation is available in the `/documentation` directory:

**API Endpoints:**

- **[API Reference](documentation/API.md)**: Complete API endpoint documentation- `POST /api/auth/register` - Register new user

- **[Architecture Guide](documentation/ARCHITECTURE.md)**: System design and component interaction- `POST /api/auth/login` - Authenticate user

- **[Development Guide](documentation/DEVELOPMENT.md)**: Setup and development workflows- `GET /api/auth/verify-token` - Verify JWT token validity

- **[Frontend Guide](documentation/FRONTEND_GUIDE.md)**: Vue.js components and state management- `POST /api/auth/verify-token` - Verify token via POST body

- **[Security Guide](documentation/SECURITY.md)**: Authentication and authorization details- `GET /api/auth/health` - Health check

- **[Troubleshooting](documentation/TROUBLESHOOTING.md)**: Common issues and solutions

### User Service (Port 3002)

## Development

Manages user profiles, roles, and permissions.

### Running in Development Mode

**Responsibilities:**

```bash- User profile CRUD operations

# Start all services- Role management (developer, moderator, admin)

docker compose up -d- User skills tracking

- Authorization checks

# View logs

docker compose logs -f [service-name]**Database**: `userdb`

- Table: `users` (id, email, name, surname, role, credentials_id)

# Restart a specific service- Table: `user_skills` (user_id, skill)

docker compose restart [service-name]

**API Endpoints:**

# Stop all services- `GET /api/users` - List all users (admin only)

docker compose down- `GET /api/users/:userId` - Get user details

```- `PUT /api/users/:userId` - Update user profile

- `DELETE /api/users/:userId` - Delete user (admin only)

### Database Access- `GET /api/roles` - List available roles

- `PUT /api/users/:userId/role` - Update user role (admin only)

**Using PgAdmin:**

1. Navigate to http://localhost:8080### Ticket Service (Port 3003)

2. Login with PgAdmin credentials

3. Add server with:Manages support tickets and topics.

   - Host: `postgres-fts`

   - Port: `5432`**Responsibilities:**

   - Username: `postgres`- Ticket CRUD operations

   - Password: `postgres`- Priority and status management

- Ticket assignment to developers

**Using psql:**- Topic categorization

```bash

docker exec -it postgres-fts psql -U postgres -d [database-name]**Database**: `ticketdb`

```- Table: `ticket` (id, title, priority, status, request, answer, etc.)

- Table: `topic` (id, name)

### Running Tests- Table: `ticket_topic` (ticket_id, topic_id)

- Table: `comment` (id, comment_text, author_id, ticket_id, creation_date)

```bash

# Run tests for a specific service**API Endpoints:**

docker exec [service-name] npm test- `GET /api/tickets` - List all tickets

```- `POST /api/tickets` - Create new ticket

- `GET /api/tickets/:ticketId` - Get ticket details

## Project Structure- `PUT /api/tickets/:ticketId` - Update ticket

- `DELETE /api/tickets/:ticketId` - Delete ticket

```

fix-this-stuff/### Comment API (Port 5003)

├── auth-service/          # Authentication microservice

├── user-service/          # User management microserviceFlask-based API for managing ticket comments with event-driven architecture.

├── ticket-service/        # Ticket management microservice

├── comment-api/           # Comment API (Flask)**Responsibilities:**

├── comments-service/      # RabbitMQ consumer- Comment CRUD operations

├── src/                   # API Gateway (Spring Boot)- Publishing comment events to RabbitMQ

├── ui/                    # Vue.js frontend- JWT token validation

├── init-scripts/          # Database initialization scripts- Direct database reads for performance

├── documentation/         # Project documentation

└── docker-compose.yml     # Docker services configuration**API Endpoints:**

```- `GET /tickets/:ticketId/comments` - List comments for a ticket

- `POST /comments` - Create new comment (publishes event)

## API Overview- `PUT /comments/:commentId` - Update comment (publishes event)

- `DELETE /comments/:commentId` - Delete comment (publishes event)

All API requests go through the API Gateway at `http://localhost:8081/api`- `GET /health` - Health check



### Authentication Endpoints### Comments Service (Consumer)

- `POST /api/auth/register` - User registration

- `POST /api/auth/login` - User loginPython service that consumes RabbitMQ events for asynchronous comment persistence.

- `GET /api/auth/verify-token` - Validate JWT token

**Responsibilities:**

### Ticket Endpoints- Listen to comment events (created, updated, deleted)

- `GET /api/tickets` - List all tickets- Persist changes to PostgreSQL

- `GET /api/tickets/search` - Search tickets- Ensure eventual consistency

- `POST /api/tickets` - Create new ticket

- `GET /api/tickets/:id` - Get ticket details**Events Handled:**

- `PUT /api/tickets/:id` - Update ticket- `comment.created` - Insert new comment

- `DELETE /api/tickets/:id` - Delete ticket (Admin/Moderator)- `comment.updated` - Update comment text

- `comment.deleted` - Remove comment

### User Endpoints

- `GET /api/users` - List all users (Admin/Moderator)### API Gateway (Port 8081)

- `GET /api/users/search` - Search users (Admin/Moderator)

- `GET /api/users/:id` - Get user detailsSpring Boot gateway for routing, authentication, and CORS.

- `PUT /api/users/:id` - Update user profile

**Responsibilities:**

For complete API documentation, see [API.md](documentation/API.md).- Route requests to appropriate microservices

- JWT token validation via AuthFilter

## User Roles- CORS configuration for frontend

- Request/response logging

### Developer (Default)- Header management for internal communication

- Create and view tickets

- Submit solutions for approval**Routing:**

- View leaderboard- `/api/auth/**` → Auth Service (no authentication required)

- Rate resolved tickets- `/api/users/**` → User Service

- `/api/tickets/**` → Ticket Service

### Moderator- `/api/comments/**` → Comment API

- All developer permissions- `/api/roles/**` → User Service

- Approve/reject ticket resolutions

- Assign tickets to developers### Frontend UI (Port 80/5173)

- View user list

- Manage ticket statusVue.js single-page application with responsive design.



### Admin**Features:**

- All moderator permissions- User authentication (login/register)

- Manage user roles- Ticket browsing and creation

- Delete tickets- User management (admin)

- Access admin dashboard- Role assignment

- Full system control- Responsive Bootstrap UI



## Contributing**Routes:**

- `/` - Home page

1. Fork the repository- `/login` - User login

2. Create a feature branch (`git checkout -b feature/amazing-feature`)- `/register` - User registration

3. Commit your changes (`git commit -m 'Add amazing feature'`)- `/tickets` - Ticket list

4. Push to the branch (`git push origin feature/amazing-feature`)- `/tickets/:id` - Ticket details

5. Open a Pull Request

## Authentication & Security

## License

### JWT Token Flow

This project is licensed under the MIT License.

The system implements a secure JWT-based authentication mechanism:

## Support

1. **User Login**: Client sends credentials to `/api/auth/login`

For issues, questions, or contributions, please open an issue on GitHub.2. **Token Generation**: Auth service validates credentials and generates JWT

3. **Token Storage**: Frontend stores token in localStorage

## Version4. **Authenticated Requests**: Client includes token in Authorization header

5. **Gateway Validation**: API Gateway validates JWT using AuthFilter

Current Version: 1.0.06. **Header Injection**: Gateway adds trusted headers (x-user, x-role) for microservices

7. **Service Authorization**: Microservices check headers for authorization

### Security Architecture

```
Frontend                API Gateway              Microservices
   │                         │                         │
   │  Authorization:         │                         │
   │  Bearer <token>         │                         │
   ├────────────────────────>│                         │
   │                         │ 1. Validate JWT         │
   │                         │ 2. Extract user/role    │
   │                         │                         │
   │                         │  x-user: 123            │
   │                         │  x-role: admin          │
   │                         │  X-Internal-Auth: true  │
   │                         ├────────────────────────>│
   │                         │                         │
   │<────────────────────────┼─────────────────────────│
```

### Security Measures

**Frontend to Gateway:**
- HTTPS recommended for production
- Bearer token authentication only
- No internal headers exposed to client

**Gateway to Microservices:**
- Trusted header injection (x-user, x-role, x-username)
- X-Internal-Auth flag for service-to-service verification
- Original Authorization header removed

**Database:**
- Passwords hashed with bcrypt (10 rounds)
- Separate databases per service
- No cross-service foreign keys

**CORS Configuration:**
- Allowed origins: localhost:5173, localhost:80, localhost:8080, localhost
- Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Credentials enabled
- Internal headers not exposed to frontend
- OPTIONS preflight requests handled at gateway level

## Frontend Configuration

### Vue.js Application

The frontend is a single-page application (SPA) built with Vue.js 3 and served via Nginx in production.

#### Environment Variables

Frontend environment variables are injected at **build time** using Vite. These must be passed as Docker build arguments in `docker-compose.yml`:

```yaml
ui:
  build:
    context: ./ui
    args:
      VITE_AUTH_API_URL: http://localhost:8081/api/auth
      VITE_USER_API_URL: http://localhost:8081/api/users
      VITE_TICKET_API_URL: http://localhost:8081/api/tickets
      VITE_ROLE_API_URL: http://localhost:8081/api/roles
      VITE_COMMENT_API_URL: http://localhost:5003/api/comments
```

**Important**: Vite replaces environment variables during the build process. Runtime environment variables will not work. Always use `build.args` in Docker Compose, not `environment`.

#### Local Development

For local development with Vite dev server:

1. Create `ui/.env.development`:
```env
VITE_AUTH_API_URL=http://localhost:8081/api/auth
VITE_USER_API_URL=http://localhost:8081/api/users
VITE_TICKET_API_URL=http://localhost:8081/api/tickets
VITE_ROLE_API_URL=http://localhost:8081/api/roles
VITE_COMMENT_API_URL=http://localhost:5003/api/comments
```

2. Run development server:
```bash
cd ui
npm install
npm run dev
```

Access at http://localhost:5173

### CORS Troubleshooting

#### Common CORS Issues

**Problem**: Browser shows "CORS policy" error or 403/405 on OPTIONS requests.

**Solution**: Ensure the origin is included in `CorsConfig.java`:

```java
config.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",  // Vite dev server
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:80",
    "http://localhost"        // Production without explicit port
));
```

**Problem**: OPTIONS requests return 405 Method Not Allowed.

**Solution**: Verify all gateway endpoints include `RequestMethod.OPTIONS` and return 200 OK:

```java
@RequestMapping(value = "/auth/**", 
    method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public ResponseEntity<String> forwardToAuthService(...) {
    if ("OPTIONS".equals(request.getMethod())) {
        return ResponseEntity.ok().build();
    }
    // ... forward logic
}
```

**Problem**: Environment variables not working in Docker build.

**Solution**: Use `build.args` instead of `environment` in docker-compose.yml. Vite requires variables at build time, not runtime.

### API Gateway Routing

All frontend requests are routed through the API Gateway at port 8081:

```
Frontend Request Flow:
Browser → http://localhost:8081/api/auth/register
         ↓
    API Gateway (Spring Boot)
         ↓ (removes /api prefix)
    auth-service:3001/auth/register
```

**Key Points:**
- Gateway adds `/api` prefix to all routes
- Microservices do NOT include `/api` in their route definitions
- Gateway forwards with prefix removed
- CORS preflight (OPTIONS) handled at gateway level before forwarding

## Getting Started

### Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- Node.js 20+ (for local frontend development)
- Maven 3.8+ (for gateway development)

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/antoninofoti/fix-this-stuff.git
cd fix-this-stuff
```

2. **Start all services:**
```bash
docker compose up --build
```

3. **Access the application:**
- Frontend: http://localhost (production) or http://localhost:5173 (development)
- API Gateway: http://localhost:8081
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- pgAdmin: http://localhost:8080 (admin@example.com/admin)

### Default Admin Account

A default admin account is created automatically on first startup:

- **Email**: admin@fixthisstuff.com
- **Password**: admin123

To override defaults:
```bash
export ADMIN_EMAIL=your.admin@example.com
export ADMIN_PASSWORD=your_secure_password
docker compose up
```

**Security Warning**: Change the default password immediately in production environments.

## API Documentation

### Authentication Endpoints

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "developer"
  },
  "credentialId": 1
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "developer"
  }
}
```

### Ticket Endpoints

All ticket endpoints require authentication via Bearer token.

#### Create Ticket
```bash
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Cannot connect to database",
  "description": "Getting connection timeout errors when trying to access the database",
  "category": 1,
  "priority": "high"
}
```

**Required Fields:**
- `title` (string): Brief description of the issue
- `description` (string): Detailed explanation of the problem
- `category` (integer): System/category ID (1-5)
- `priority` (string): One of "low", "medium", "high"

**Response:**
```json
{
  "message": "Ticket created successfully",
  "ticket": {
    "id": 5,
    "title": "Cannot connect to database",
    "priority": "high",
    "flag_status": "open",
    "solve_status": "not_solved",
    "request_author_id": 4,
    "system_id": 1,
    "opening_date": "2025-10-31T10:34:41.000Z",
    "deadline_date": "2025-11-07T10:34:41.000Z"
  }
}
```

#### List Tickets
```bash
GET /api/tickets
Authorization: Bearer <token>
```

#### Get Ticket Details
```bash
GET /api/tickets/:ticketId
Authorization: Bearer <token>
```

### Comment Endpoints

#### Get Comments for Ticket
```bash
GET /tickets/:ticketId/comments
```

**Response:**
```json
[
  {
    "id": 1,
    "ticket_id": 1,
    "author_id": 2,
    "comment_text": "This issue is related to network configuration",
    "creation_date": "2025-10-30 14:23"
  }
]
```

#### Add Comment
```bash
POST /comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "ticket_id": 1,
  "comment_text": "I have the same problem"
}
```

## Development Guide

This section provides comprehensive guidance for developing, building, and testing the application both in Docker and locally.

### Development Workflow

#### 1. Starting with Docker (Recommended)

For the most consistent development environment, use Docker Compose:

```bash
# Build and start all services
docker compose up --build

# Start services in detached mode
docker compose up -d

# View logs for specific service
docker compose logs -f api-gateway
docker compose logs -f ui

# Restart a specific service after code changes
docker compose restart auth-service

# Rebuild a service after major changes
docker compose up -d --build auth-service

# Stop all services
docker compose down

# Stop and remove all volumes (clean slate)
docker compose down -v
```

#### 2. Local Frontend Development

For faster frontend iteration with hot-reload:

```bash
cd ui
npm install
npm run dev
```

Frontend will be available at http://localhost:5173 with hot-reload enabled.

**Note**: When developing locally, ensure your `.env.local` file points to the running API Gateway:
```
VITE_AUTH_API_URL=http://localhost:8081/api/auth
VITE_USER_API_URL=http://localhost:8081/api/users
VITE_TICKET_API_URL=http://localhost:8081/api/tickets
VITE_ROLE_API_URL=http://localhost:8081/api/roles
VITE_COMMENT_API_URL=http://localhost:5003/api/comments
```

#### 3. Local Microservice Development

For debugging individual Node.js microservices locally:

```bash
# Example: Auth Service
cd auth-service
npm install

# Set environment variables
export DB_USER=admin
export DB_PASSWORD=admin123
export DB_HOST=localhost
export DB_NAME=authdb
export JWT_SECRET=your-secret-key
export PORT=3001

# Run service
npm start
```

**Important**: Ensure PostgreSQL is accessible on `localhost:5432` or update `DB_HOST` accordingly.

#### 4. Building the API Gateway

The API Gateway is a Spring Boot application built with Maven:

```bash
cd src
mvn clean package
```

The JAR file will be created in `target/api-gateway-0.0.1-SNAPSHOT.jar`.

To run locally:
```bash
cd src
mvn spring-boot:run

# Or run the built JAR
java -jar target/api-gateway-0.0.1-SNAPSHOT.jar
```

### Environment Variables

#### API Gateway Environment Variables
- `JWT_SECRET`: Secret key for JWT validation (must match microservices)
- `USER_SERVICE_URL`: User service endpoint (default: http://user-service:3002)
- `TICKET_SERVICE_URL`: Ticket service endpoint (default: http://ticket-service:3003)
- `COMMENT_SERVICE_URL`: Comment API endpoint (default: http://comment-api:5003)

#### Frontend Environment Variables (.env.local for local development)
```
VITE_AUTH_API_URL=http://localhost:8081/api/auth
VITE_USER_API_URL=http://localhost:8081/api/users
VITE_TICKET_API_URL=http://localhost:8081/api/tickets
VITE_ROLE_API_URL=http://localhost:8081/api/roles
VITE_COMMENT_API_URL=http://localhost:8081/api/comments
```

**Note**: In Docker, these are set via build arguments in `docker-compose.yml`. See Frontend Configuration section above.

#### Microservices Environment Variables
All Node.js microservices (auth, user, ticket) require:
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_NAME`: Database name
- `JWT_SECRET`: JWT secret (must match across all services and gateway)
- `PORT`: Service port number

#### Comment API Environment Variables (Python Flask)
- `COMMENT_DATABASE_URL`: PostgreSQL connection string
- `RABBITMQ_HOST`: RabbitMQ host (default: rabbitmq)
- `RABBITMQ_PORT`: RabbitMQ port (default: 5672)
- `RABBITMQ_USER`: RabbitMQ username
- `RABBITMQ_PASS`: RabbitMQ password

### Database Schema Management

Database initialization scripts are located in `/init-scripts` and run automatically when PostgreSQL container starts:

- `00-init-multi-db.sh`: Creates multiple databases (authdb, userdb, ticketdb)
- `01-auth-schema.sql`: Auth service schema (credentials table)
- `02-user-schema.sql`: User service schema (users table with roles)
- `03-ticket-schema.sql`: Ticket and comment schema
- `04-default-admin.sql`: Default admin user (email: admin@example.com, password: admin123)
- `05-role-update.sql`: Role field updates
- `06-ticket-updates.sql`: Ticket schema updates

**To reset databases**: Stop containers and remove volumes:
```bash
docker compose down -v
docker compose up -d
```

**To apply schema updates manually**:
```bash
# Connect to PostgreSQL container
docker exec -it postgres psql -U admin -d ticketdb

# Run SQL commands
\i /docker-entrypoint-initdb.d/06-ticket-updates.sql
```

### Testing

#### API Testing with curl

**Test Authentication Flow:**
```bash
# Register a new user
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"test123",
    "firstName":"Test",
    "lastName":"User"
  }'

# Login and save token
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"test123"
  }' | jq -r '.token')

# Verify token was received
echo "Token: $TOKEN"

# Get user profile (authenticated request)
curl -X GET http://localhost:8081/api/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Test Ticket Creation:**
```bash
# Create a ticket (requires authentication)
curl -X POST http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"API Test Ticket",
    "description":"Testing ticket creation via API",
    "category":1,
    "priority":"high"
  }'

# List all tickets
curl -X GET http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN"

# Get specific ticket
curl -X GET http://localhost:8081/api/tickets/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Test User Management (Admin only):**
```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"admin123"
  }' | jq -r '.token')

# List all users
curl -X GET http://localhost:8081/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Update user role
curl -X PATCH http://localhost:8081/api/users/2/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"moderator"}'
```

#### Browser Testing

Access the frontend at http://localhost after starting Docker Compose:

1. **Register**: Create a new account at http://localhost/register
2. **Login**: Sign in at http://localhost/login
3. **Create Ticket**: Use the form at http://localhost/tickets to create a ticket
4. **View Tickets**: Browse tickets and their details

#### Frontend Unit Testing

```bash
cd ui
npm run test
```

#### Integration Testing

For comprehensive integration tests, use the provided test script:
```bash
./scripts/test-all.sh
```

This script tests:
- Database connectivity
- Service health endpoints
- Authentication flow
- Ticket CRUD operations
- User role management

## Troubleshooting

This section covers common issues you may encounter during development and deployment, along with their solutions.

### Common Issues

#### Port Already in Use

**Symptoms**: Error starting containers with messages like "bind: address already in use"

**Cause**: Another application is using the required ports (80, 8081, 3001-3003, 5432, 5672, 15672, 5003, 8080)

**Solution**: 
```bash
# Check what's using a specific port
sudo lsof -i :8081

# Stop the conflicting service or change ports in docker-compose.yml
docker compose down
# Kill the process using the port, then restart
docker compose up -d
```

#### Error 500 During Registration

**Symptoms**: Registration fails with HTTP 500 Internal Server Error

**Cause**: Database schema inconsistency between `rank` and `role` fields, or database not initialized

**Solution**: 
1. Ensure database initialization scripts ran successfully:
```bash
docker compose logs postgres | grep "init-scripts"
```

2. If needed, recreate database:
```bash
docker compose down -v
docker compose up -d
```

3. Verify the fix: The user model now correctly uses the `role` field throughout all services.

#### CORS Errors in Browser

**Symptoms**: Browser console shows errors like:
- "Access to XMLHttpRequest at '...' has been blocked by CORS policy"
- "No 'Access-Control-Allow-Origin' header is present"
- "Response to preflight request doesn't pass access control check"

**Cause**: Frontend origin not in CORS allowed list, or OPTIONS preflight not handled

**Solutions**:

1. **For development on non-standard ports**: Update `src/main/java/com/example/config/CorsConfig.java`:
```java
config.setAllowedOrigins(Arrays.asList(
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://your-domain.com"
));
```

2. **For HTTP 405 errors on OPTIONS requests**: Verify `AuthFilter.java` bypasses OPTIONS:
```java
if ("OPTIONS".equals(exchange.getRequest().getMethod().toString())) {
    return chain.filter(exchange);
}
```

3. **For HTTP 403 errors**: Check that origin exactly matches (including protocol and port):
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:8081/api/auth/register \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

#### Cannot Connect to Microservices

**Symptoms**: API Gateway returns 500 error, logs show "Connection refused" to microservices

**Cause**: Services not on same Docker network, or service names don't match

**Solution**: 

1. Verify all services use `fts-network`:
```bash
docker network inspect fix-this-stuff_fts-network
```

2. Ensure service names in `docker-compose.yml` match environment variables:
```yaml
services:
  auth-service:
    networks:
      - fts-network
  user-service:
    networks:
      - fts-network
```

3. Check service health:
```bash
docker compose ps
```

#### RabbitMQ Connection Refused

**Symptoms**: Comment service fails to connect to RabbitMQ on startup

**Cause**: RabbitMQ not ready when consumers start

**Solution**: 
1. Wait 10-15 seconds for RabbitMQ to fully initialize (includes automatic retry logic)
2. Check RabbitMQ status:
```bash
docker compose logs rabbitmq
# Should see "Server startup complete"
```

3. Verify RabbitMQ connection:
```bash
docker exec -it rabbitmq rabbitmqctl status
```

#### Database Connection Errors

**Symptoms**: Services fail to start with "ECONNREFUSED" or "authentication failed"

**Cause**: PostgreSQL not ready, wrong credentials, or database not created

**Solution**:

1. Check PostgreSQL is running:
```bash
docker compose ps postgres
docker compose logs postgres
```

2. Verify databases were created:
```bash
docker exec -it postgres psql -U admin -l
# Should list: authdb, userdb, ticketdb
```

3. Check credentials match in `docker-compose.yml` for all services:
```yaml
DB_USER: admin
DB_PASSWORD: admin123
```

4. Test connection manually:
```bash
docker exec -it postgres psql -U admin -d authdb
\dt  # List tables
```

#### Vite Environment Variables Not Working

**Symptoms**: Frontend makes requests to wrong URLs, variables appear as `undefined`

**Cause**: Environment variables not set at build time, or using runtime environment instead of build args

**Solution**:

1. Verify `docker-compose.yml` uses `build.args` for ui service:
```yaml
ui:
  build:
    context: ./ui
    args:
      VITE_AUTH_API_URL: http://localhost:8081/api/auth
      # ... other VITE_* variables
```

2. Ensure `ui/Dockerfile` declares ARGs and ENVs:
```dockerfile
ARG VITE_AUTH_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
```

3. Rebuild frontend:
```bash
docker compose up -d --build ui
```

4. For local development, create `.env.local`:
```bash
cd ui
echo "VITE_AUTH_API_URL=http://localhost:8081/api/auth" > .env.local
```

#### Ticket Creation Returns 400 Bad Request

**Symptoms**: "Category/system ID must be an integer" error

**Cause**: Frontend sending category as string instead of integer

**Solution**: Use `v-model.number` in Vue forms:
```vue
<select v-model.number="category" class="form-select">
  <option value="1">System 1</option>
  <option value="2">System 2</option>
</select>
```

Ensure category values are integers (1-5), not strings.

### Logs and Debugging

#### Viewing Service Logs

View logs for specific services:
```bash
# Individual services
docker compose logs -f auth-service
docker compose logs -f user-service
docker compose logs -f ticket-service
docker compose logs -f comment-api
docker compose logs -f comments-service
docker compose logs -f api-gateway
docker compose logs -f ui

# Multiple services at once
docker compose logs -f auth-service user-service

# All services
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100 auth-service
```

#### Debugging Inside Containers

Execute commands inside running containers:
```bash
# Access bash shell
docker exec -it auth-service bash
docker exec -it api-gateway bash

# Check Node.js process
docker exec -it auth-service ps aux | grep node

# View environment variables
docker exec -it auth-service env | grep DB_

# Test internal network connectivity
docker exec -it api-gateway ping auth-service
docker exec -it api-gateway curl http://user-service:3002/health
```

#### Network Debugging

Inspect Docker networks:
```bash
# List networks
docker network ls

# Inspect fts-network
docker network inspect fix-this-stuff_fts-network

# Find service IPs
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' auth-service
```

#### Database Debugging

Access PostgreSQL directly:
```bash
# Connect to database
docker exec -it postgres psql -U admin -d authdb

# Useful SQL commands
\l              # List databases
\c userdb       # Connect to database
\dt             # List tables
\d users        # Describe table
SELECT * FROM users;  # Query data

# Check user roles
SELECT id, email, role FROM users;

# Check credentials
SELECT * FROM credentials WHERE email = 'test@example.com';
```

#### API Gateway Debugging

Enable debug logging in API Gateway:
```bash
# Edit application.properties or application-docker.properties
logging.level.com.example=DEBUG
logging.level.org.springframework.web=DEBUG

# Rebuild and restart
docker compose up -d --build api-gateway
docker compose logs -f api-gateway
```

#### Frontend Debugging

Access frontend build logs:
```bash
# View build output
docker compose logs ui

# Check nginx configuration
docker exec -it ui-frontend cat /etc/nginx/nginx.conf

# View nginx access logs
docker exec -it ui-frontend tail -f /var/log/nginx/access.log
docker exec -it ui-frontend tail -f /var/log/nginx/error.log
```

For local development debugging:
```bash
cd ui
npm run dev
# Open browser console (F12) to see network requests and errors
```

#### Performance Debugging

Monitor container resource usage:
```bash
# Real-time stats
docker stats

# Specific containers
docker stats auth-service user-service api-gateway
```

Check service response times:
```bash
# Test endpoint performance
time curl -X GET http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN"

# Use Apache Bench for load testing
ab -n 100 -c 10 http://localhost:8081/api/tickets
```

## Project Status

### Completed Features

- Core microservices architecture (100%)
- JWT authentication and authorization (100%)
- User management with role-based access (100%)
- Ticket CRUD operations (100%)
- API Gateway with routing and security (100%)
- Backend comment system with RabbitMQ (100%)
- Frontend authentication and user management (100%)
- Frontend ticket management (100%)
- Docker containerization (100%)

### In Progress

- Frontend comment interface (0%)
  - Comment list component needed
  - Comment form component needed
  - Integration with TicketView
  - Store implementation for comment state

### Known Limitations

1. **Comment System Frontend**: Backend is complete but frontend UI is not implemented
2. **Real-time Notifications**: Not implemented (could use WebSockets with RabbitMQ)
3. **File Attachments**: Not supported for tickets or comments
4. **Email Notifications**: Not implemented
5. **Audit Logging**: Limited logging of user actions

## License

This project is provided as-is for educational purposes.

## Acknowledgments

- Spring Boot team for the excellent framework
- Vue.js community for frontend tools
- PostgreSQL and RabbitMQ communities

If you need to create an additional admin user manually:

```bash
# Syntax: ./scripts/create-admin-user.sh [email] [password]
./scripts/create-admin-user.sh newadmin@example.com secure_password
```
