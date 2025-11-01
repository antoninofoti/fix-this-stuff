# Development Guide

This guide provides comprehensive instructions for developing, building, and testing the application.

## Development Workflow

### Starting with Docker (Recommended)

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

### Local Frontend Development

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
VITE_COMMENT_API_URL=http://localhost:5003
```

### Local Microservice Development

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

### Building the API Gateway

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

## Environment Variables

### API Gateway
- `JWT_SECRET`: Secret key for JWT validation (must match microservices)
- `USER_SERVICE_URL`: User service endpoint (default: http://user-service:3002)
- `TICKET_SERVICE_URL`: Ticket service endpoint (default: http://ticket-service:3003)
- `COMMENT_SERVICE_URL`: Comment API endpoint (default: http://comment-api:5003)

### Frontend (.env.local for local development)
```
VITE_AUTH_API_URL=http://localhost:8081/api/auth
VITE_USER_API_URL=http://localhost:8081/api/users
VITE_TICKET_API_URL=http://localhost:8081/api/tickets
VITE_ROLE_API_URL=http://localhost:8081/api/roles
VITE_COMMENT_API_URL=http://localhost:5003
```

**Important Notes:**
- In Docker, these are set via build arguments in `docker-compose.yml`
- The Comment API is accessed directly on port 5003, not through the API Gateway at port 8081
- This architectural decision allows the comment system to scale independently and leverage event-driven processing

### Microservices
All Node.js microservices (auth, user, ticket) require:
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_NAME`: Database name
- `JWT_SECRET`: JWT secret (must match across all services and gateway)
- `PORT`: Service port number

### Comment API (Python Flask)
- `COMMENT_DATABASE_URL`: PostgreSQL connection string
- `RABBITMQ_HOST`: RabbitMQ host (default: rabbitmq)
- `RABBITMQ_PORT`: RabbitMQ port (default: 5672)
- `RABBITMQ_USER`: RabbitMQ username
- `RABBITMQ_PASS`: RabbitMQ password

## Database Schema Management

Database initialization scripts are located in `/init-scripts` and run automatically when PostgreSQL container starts:

- `00-init-multi-db.sh`: Creates multiple databases (authdb, userdb, ticketdb)
- `01-auth-schema.sql`: Auth service schema (credentials table)
- `02-user-schema.sql`: User service schema (users table with roles)
- `03-ticket-schema.sql`: Ticket and comment schema
- `04-default-admin.sql`: Default admin user
- `05-role-update.sql`: Role field updates
- `06-ticket-updates.sql`: Ticket schema updates

**To reset databases**:
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

## Testing

### API Testing with curl

**Authentication Flow:**
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

# Get user profile
curl -X GET http://localhost:8081/api/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Ticket Creation:**
```bash
# Create a ticket
curl -X POST http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"API Test Ticket",
    "description":"Testing ticket creation",
    "category":1,
    "priority":"high"
  }'

# List all tickets
curl -X GET http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN"
```

### Browser Testing

Access the frontend at http://localhost after starting Docker Compose:

1. **Register**: Create a new account at http://localhost/register
2. **Login**: Sign in at http://localhost/login
3. **Create Ticket**: Use the form at http://localhost/tickets
4. **View Tickets**: Browse tickets and their details

### Frontend Unit Testing

```bash
cd ui
npm run test
```

### Integration Testing

```bash
./scripts/test-all.sh
```

## Frontend Configuration

### Vue.js Application

The frontend is built with Vue.js 3 and served via Nginx in production.

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
      VITE_COMMENT_API_URL: http://localhost:5003
```

**Important Notes:**
- Vite replaces environment variables during build time, not runtime
- `VITE_COMMENT_API_URL` points directly to port 5003 (Comment API), not to the gateway
- All other API calls go through the gateway on port 8081

### CORS Configuration

#### Common Issues

1. **CORS policy errors**: Ensure origin is in `CorsConfig.java` allowed list
2. **OPTIONS 405 errors**: Verify gateway endpoints include `RequestMethod.OPTIONS`
3. **Environment variables not working**: Use `build.args` instead of `environment` in docker-compose.yml

### API Gateway Routing

Most frontend requests route through the API Gateway at port 8081:

```
Browser → http://localhost:8081/api/auth/register
         ↓
    API Gateway (Spring Boot)
         ↓ (removes /api prefix)
    auth-service:3001/auth/register
```

**Key Points:**
- Gateway adds `/api` prefix to all routes
- Microservices do NOT include `/api` in route definitions
- CORS preflight (OPTIONS) handled at gateway level

**Exception:** Comment API requests bypass the gateway and go directly to port 5003:

```
Browser → http://localhost:5003/comments
         ↓
    Comment API (Flask)
         ↓
    PostgreSQL + RabbitMQ
```

This architectural decision enables:
- Independent scaling of the comment service
- Event-driven architecture with RabbitMQ for asynchronous processing
- Reduced load on the API Gateway

## Code Style

### Backend (Node.js)
- Use ES6+ features
- Follow Express.js best practices
- Use async/await for asynchronous operations
- Handle errors with try-catch blocks

### Backend (Java)
- Follow Spring Boot conventions
- Use dependency injection
- Implement proper exception handling

### Frontend (Vue.js)
- Use Composition API
- Follow Vue 3 style guide
- Use TypeScript for type safety (recommended)
- Implement proper component structure

## Git Workflow

1. Create feature branches from `main`
2. Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
3. Keep commits focused and atomic
4. Write descriptive commit messages (max 50 characters for title)
5. Test before committing
6. Create pull requests for review
