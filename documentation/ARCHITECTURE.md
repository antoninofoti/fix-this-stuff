# Architecture Documentation

## System Components

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────>│ API Gateway  │────>│  Microservices  │
│  (Vue.js)   │     │ (Spring Boot)│     │   (Node.js)     │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                       │
                           v                       v
                    ┌──────────────┐      ┌──────────────┐
                    │  AuthFilter  │      │  PostgreSQL  │
                    │  (JWT Verify)│      │  (Databases) │
                    └──────────────┘      └──────────────┘
```

## Microservices Architecture

The application follows a microservices pattern with service isolation:

- **Separate databases** per service (authdb, userdb, ticketdb)
- **API Gateway** for request routing and authentication
- **Service-to-service communication** via REST APIs
- **Event-driven comments** using RabbitMQ message broker

## Technology Stack

### Backend
- **API Gateway**: Spring Boot (Java), port 8081
- **Auth Service**: Node.js/Express, port 3001
- **User Service**: Node.js/Express, port 3002
- **Ticket Service**: Node.js/Express, port 3003
- **Comment API**: Python/Flask, port 5003
- **Comments Consumer**: Python (RabbitMQ consumer)

### Infrastructure
- **Database**: PostgreSQL (separate databases per service)
- **Message Broker**: RabbitMQ
- **Reverse Proxy**: Nginx (for frontend)
- **Container Orchestration**: Docker Compose

### Frontend
- **Framework**: Vue.js 3 with Composition API
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **UI Framework**: Bootstrap 5
- **Build Tool**: Vite

## Services Overview

### Auth Service (Port 3001)

Handles authentication and credential management.

**Responsibilities:**
- User registration and login
- JWT token generation and verification
- Credential storage and validation
- Password hashing with bcrypt

**Database**: `authdb`
- Table: `credentials` (id, username, password, registration_date, role)

### User Service (Port 3002)

Manages user profiles, roles, and permissions.

**Responsibilities:**
- User profile CRUD operations
- Role management (developer, moderator, admin)
- User skills tracking
- Authorization checks

**Database**: `userdb`
- Table: `users` (id, name, surname, email, rank, registration_date, credentials_id, role)
- Table: `user_skills` (user_id, skill)

### Ticket Service (Port 3003)

Manages support tickets and topics.

**Responsibilities:**
- Ticket CRUD operations
- Priority and status management
- Ticket assignment to developers
- Topic categorization

**Database**: `ticketdb`
- Table: `ticket` (id, title, priority, opening_date, deadline_date, flag_status, solve_status. request, answer, request_author_id, assigned_developer_id, system_id)
- Table: `topic` (id, name)
- Table: `ticket_topic` (ticket_id, topic_id)
- Table: `comment` (id, comment_text, author_id, ticket_id, creation_date)

### Comment API (Port 5003)

Flask-based API for managing ticket comments with event-driven architecture. This service is accessed directly by the frontend (not through the API Gateway) to enable independent scaling.

**Responsibilities:**
- Comment CRUD operations
- Publishing comment events to RabbitMQ for asynchronous processing
- JWT token validation for write operations
- Direct database reads for performance

**Endpoints:**
- `GET /tickets/:ticketId/comments` - Retrieve comments (no authentication)
- `POST /comments` - Create comment (requires authentication)
- `PUT /comments/:commentId` - Update comment (requires authentication)
- `DELETE /comments/:commentId` - Delete comment (requires authentication)
- `GET /health` - Health check endpoint

### Comments Service (Consumer)

Python service that consumes RabbitMQ events for asynchronous comment persistence.

**Responsibilities:**
- Listen to comment events (created, updated, deleted)
- Persist changes to PostgreSQL
- Ensure eventual consistency

**Events Handled:**
- `comment.created` - Insert new comment
- `comment.updated` - Update comment text
- `comment.deleted` - Remove comment

### API Gateway (Port 8081)

Spring Boot gateway for routing, authentication, and CORS.

**Responsibilities:**
- Route requests to appropriate microservices
- JWT token validation via AuthFilter
- CORS configuration for frontend
- Request/response logging
- Header management for internal communication

**Routing:**
- `/api/auth/**` → Auth Service (no authentication required)
- `/api/users/**` → User Service
- `/api/tickets/**` → Ticket Service
- `/api/roles/**` → User Service

**Note:** The Comment API is accessed directly by the frontend (not through the gateway) to allow independent scaling and to support event-driven architecture with RabbitMQ.

### Frontend UI (Port 80/5173)

Vue.js single-page application with responsive design.

**Features:**
- User authentication (login/register)
- Ticket browsing and creation
- User management (admin)
- Role assignment
- Responsive Bootstrap UI

**Routes:**
- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/tickets` - Ticket list
- `/tickets/:id` - Ticket details
