# Security Documentation

## JWT Token Flow

The system implements a secure JWT-based authentication mechanism:

1. **User Login**: Client sends credentials to `/api/auth/login`
2. **Token Generation**: Auth service validates credentials and generates JWT
3. **Token Storage**: Frontend stores token in localStorage
4. **Authenticated Requests**: Client includes token in Authorization header
5. **Gateway Validation**: API Gateway validates JWT using AuthFilter
6. **Header Injection**: Gateway adds trusted headers (x-user, x-role) for microservices
7. **Service Authorization**: Microservices check headers for authorization

## Security Architecture

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

## Security Measures

### Frontend to Gateway

- HTTPS recommended for production
- Bearer token authentication only
- No internal headers exposed to client

### Gateway to Microservices

- Trusted header injection (x-user, x-role, x-username)
- X-Internal-Auth flag for service-to-service verification
- Original Authorization header removed

### Direct Service Access (Comment API)

The Comment API is accessed directly by the frontend (not through the gateway):

- Write operations (POST, PUT, DELETE) require JWT authentication
- Read operations (GET) are public for performance
- JWT validation performed by calling Auth Service
- Authorization checks ensure users can only modify their own comments

**Security Considerations:**
- Comment API exposed on port 5003 requires proper firewall configuration in production
- Rate limiting should be implemented at the infrastructure level
- Consider adding API Gateway routing for Comment API in production for additional security layer

### Database Security

- Passwords hashed with bcrypt (10 rounds)
- Separate databases per service
- No cross-service foreign keys
- Comment data stored in ticket database for consistency

### CORS Configuration

- Allowed origins: localhost:5173, localhost:80, localhost:8080, localhost
- Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Credentials enabled
- Internal headers not exposed to frontend
- OPTIONS preflight requests handled at gateway level

## Default Credentials

A default admin account is created automatically on first startup:

- **Username**: admin
- **Password**: admin123

**Important**: When logging in, use `admin` in the email field. The system uses username-based authentication, stored in the credentials table.

**Security Warning**: Change the default password immediately in production environments.

### Manual Admin User Creation

To create additional admin users manually:

```bash
# Using the provided script
./scripts/create-admin-user.sh newadmin@example.com secure_password

# Or via environment variables (requires code modification)
export ADMIN_EMAIL=your.admin@example.com
export ADMIN_PASSWORD=your_secure_password
docker compose up
```

## Best Practices

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Rotate JWT secrets**: Change `JWT_SECRET` regularly in production
3. **Use HTTPS**: Always use TLS/SSL in production environments
4. **Implement rate limiting**: Add rate limiting to prevent brute force attacks
5. **Monitor authentication logs**: Track failed login attempts
6. **Use strong passwords**: Enforce password complexity requirements
7. **Regular security audits**: Review and update dependencies regularly
