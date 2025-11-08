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

### Branching Strategy

1. **main**: Production-ready code
2. **develop**: Integration branch for features
3. **feature/***: New features (e.g., `feature/user-search`)
4. **bugfix/***: Bug fixes (e.g., `bugfix/login-error`)
5. **hotfix/***: Urgent production fixes

### Commit Conventions

Use conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build)

**Examples:**
```bash
git commit -m "feat(tickets): add search endpoint for tickets"
git commit -m "fix(auth): resolve JWT expiration issue"
git commit -m "docs(api): update authentication endpoints"
```

### Development Workflow

1. Create feature branch from `main` or `develop`
2. Make changes and test locally
3. Commit with conventional commit messages
4. Push to remote repository
5. Create pull request with description
6. Address review comments
7. Merge after approval

## Project Structure

### Backend Services Structure

Each Node.js microservice follows this structure:

```
service-name/
├── src/
│   ├── server.js           # Entry point
│   ├── config/
│   │   └── db.js          # Database configuration
│   ├── controllers/        # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── services/          # Business logic
├── Dockerfile
├── package.json
└── .env.example
```

### Frontend Structure

```
ui/
├── public/                # Static assets
├── src/
│   ├── main.js           # Application entry
│   ├── App.vue           # Root component
│   ├── api/              # API client modules
│   ├── components/       # Reusable components
│   ├── views/            # Page components
│   ├── router/           # Vue Router config
│   ├── store/            # Pinia stores
│   └── assets/           # Images, styles
├── index.html
├── vite.config.js
├── package.json
└── nginx.conf            # Production server config
```

### Database Initialization Scripts

```
init-scripts/
├── 00-init-multi-db.sh              # Create databases
├── 01-auth-schema.sql               # Auth service schema
├── 02-user-schema.sql               # User service schema
├── 03-ticket-schema.sql             # Ticket service schema
├── 04-default-admin.sql             # Default admin user
└── 05-ticket-updates.sql            # Resolution workflow
```

Scripts execute in alphanumeric order during PostgreSQL initialization.

## Development Best Practices

### Database Migrations

When modifying database schema:

1. **Create Migration Script**: Add new `.sql` file in `init-scripts/` with sequential number
2. **Test Locally**: Reset database and verify migration
3. **Document Changes**: Update ARCHITECTURE.md with schema changes
4. **Backup Production**: Always backup before applying migrations

**Example Migration:**
```bash
# Create new migration
cat > init-scripts/06-add-ticket-rating.sql << 'EOF'
ALTER TABLE ticket ADD COLUMN rating INTEGER;
ALTER TABLE ticket ADD CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5);
EOF

# Test migration
docker compose down -v
docker compose up -d
```

### API Development

When adding new endpoints:

1. **Design First**: Define request/response format
2. **Update Routes**: Add route in appropriate service
3. **Implement Controller**: Add business logic
4. **Add Validation**: Validate input data
5. **Error Handling**: Handle edge cases gracefully
6. **Update Gateway**: Add route in API Gateway if needed
7. **Document**: Update API.md with new endpoint
8. **Test**: Write integration tests

### Frontend Component Development

When creating new components:

1. **Single Responsibility**: Each component should do one thing well
2. **Props and Events**: Use props for input, emit events for output
3. **Composition API**: Use `<script setup>` syntax
4. **Reactive Data**: Use `ref()` for primitives, `reactive()` for objects
5. **Computed Properties**: For derived state
6. **Lifecycle Hooks**: Use `onMounted()`, `onUnmounted()` when needed
7. **Error Handling**: Display user-friendly error messages

**Example Component:**
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'

const props = defineProps({
  ticketId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['ticket-updated'])

const authStore = useAuthStore()
const ticket = ref(null)
const loading = ref(false)

const canEdit = computed(() => {
  return ticket.value?.created_by === authStore.user?.id
})

onMounted(async () => {
  await fetchTicket()
})

async function fetchTicket() {
  loading.value = true
  try {
    // Fetch ticket logic
  } catch (error) {
    console.error('Failed to fetch ticket:', error)
  } finally {
    loading.value = false
  }
}
</script>
```

### Security Best Practices

1. **Never Commit Secrets**: Use `.env` files (add to `.gitignore`)
2. **Validate Input**: Always validate and sanitize user input
3. **Use Parameterized Queries**: Prevent SQL injection
4. **Hash Passwords**: Always use bcrypt for password storage
5. **HTTPS in Production**: Use SSL/TLS certificates
6. **JWT Expiration**: Set reasonable token expiration times
7. **CORS Configuration**: Only allow trusted origins
8. **Rate Limiting**: Implement rate limiting on public endpoints

### Performance Best Practices

1. **Database Indexes**: Index frequently queried columns
2. **Connection Pooling**: Reuse database connections
3. **Async Processing**: Use RabbitMQ for long-running tasks
4. **Caching**: Cache static content and frequently accessed data
5. **Pagination**: Limit query results with offset/limit
6. **Lazy Loading**: Load data only when needed
7. **Bundle Optimization**: Use Vite code splitting for frontend

### Testing Best Practices

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test API endpoints end-to-end
3. **Component Tests**: Test Vue components in isolation
4. **E2E Tests**: Test complete user workflows
5. **Test Coverage**: Aim for >80% code coverage
6. **Mock External Services**: Use mocks for databases and APIs in tests
7. **Test Error Cases**: Test both success and failure scenarios

## Debugging Techniques

### Backend Debugging

#### Enable Debug Logging

**Node.js Services:**
```javascript
// Add to server.js
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body)
    next()
  })
}
```

**API Gateway:**
```properties
# application.properties
logging.level.com.example=DEBUG
logging.level.org.springframework.web=DEBUG
```

#### Attach Debugger

**Node.js with Chrome DevTools:**
```bash
# Add --inspect flag
node --inspect src/server.js

# Open chrome://inspect in Chrome
# Click "inspect" on your service
```

**VS Code Launch Configuration:**
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Docker",
  "remoteRoot": "/app",
  "localRoot": "${workspaceFolder}/auth-service",
  "port": 9229
}
```

### Frontend Debugging

#### Browser DevTools

1. **Console**: Check for JavaScript errors and log output
2. **Network Tab**: Inspect API requests and responses
3. **Vue DevTools**: Install extension for component inspection
4. **Application Tab**: Check localStorage for JWT tokens

#### Vue DevTools

Install Chrome extension:
- Inspect component hierarchy
- View component state and props
- Track Pinia store state
- Monitor events

#### Debug API Calls

```javascript
// Add interceptor in api client
axios.interceptors.request.use(config => {
  console.log('Request:', config.method, config.url, config.data)
  return config
})

axios.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data)
    return response
  },
  error => {
    console.error('Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)
```

### Database Debugging

#### Query Logging

Enable query logging in PostgreSQL:
```bash
# Edit postgresql.conf or set via environment
docker exec -it postgres psql -U admin -d ticketdb -c \
  "ALTER DATABASE ticketdb SET log_statement = 'all';"

# View logs
docker compose logs postgres | grep "LOG:  statement"
```

#### Inspect Tables

```bash
# Connect to database
docker exec -it postgres psql -U admin -d ticketdb

# Common commands
\dt                          # List tables
\d ticket                    # Describe ticket table
SELECT * FROM ticket LIMIT 5; # Query data
\x                          # Toggle expanded display
\q                          # Quit
```

#### Analyze Query Performance

```sql
-- Enable timing
\timing

-- Explain query plan
EXPLAIN ANALYZE SELECT * FROM ticket WHERE priority = 'high';

-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Common Development Tasks

### Adding a New Microservice

1. Create service directory with standard structure
2. Implement Express server with routes and controllers
3. Add database configuration and models
4. Create Dockerfile for containerization
5. Add service to `docker-compose.yml`
6. Update API Gateway routing (if needed)
7. Document endpoints in API.md
8. Update ARCHITECTURE.md with service description

### Adding a New Database Table

1. Create migration script in `init-scripts/`
2. Define table schema with constraints
3. Add indexes for performance
4. Create model in appropriate service
5. Implement CRUD operations
6. Update ARCHITECTURE.md with schema
7. Test migration locally

### Adding a New Frontend Route

1. Create view component in `src/views/`
2. Add route to `src/router/index.js`
3. Add navigation link in Navbar (if needed)
4. Implement navigation guards for authentication/authorization
5. Test route navigation and permissions
6. Update documentation

### Updating Dependencies

```bash
# Backend (Node.js)
cd auth-service
npm outdated              # Check for updates
npm update                # Update minor/patch versions
npm install package@latest # Update specific package

# Frontend
cd ui
npm outdated
npm update
npm install package@latest

# Rebuild containers
docker compose up -d --build
```

## Resources

### Documentation
- [Vue.js 3 Documentation](https://vuejs.org/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI
- [Vue DevTools](https://devtools.vuejs.org/) - Vue debugging
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management

### Code Quality
- [ESLint](https://eslint.org/) - JavaScript linting
- [Prettier](https://prettier.io/) - Code formatting
- [SonarQube](https://www.sonarqube.org/) - Code quality analysis

