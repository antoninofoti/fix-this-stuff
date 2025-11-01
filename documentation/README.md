# Documentation Structure

This directory contains comprehensive documentation for the Fix This Stuff ticket management system.

## Available Documentation

### [ARCHITECTURE.md](ARCHITECTURE.md)
Complete system architecture documentation including:
- System components and data flow
- Microservices architecture pattern
- Technology stack details
- Service responsibilities and endpoints
- Database schema overview

### [API.md](API.md)
Complete API reference with examples:
- Authentication endpoints (register, login)
- Ticket management endpoints
- User management endpoints
- Comment system endpoints
- Request/response examples
- Error responses

### [SECURITY.md](SECURITY.md)
Security architecture and best practices:
- JWT authentication flow
- Security measures by layer
- CORS configuration
- Default credentials
- Security best practices
- Threat model considerations

### [DEVELOPMENT.md](DEVELOPMENT.md)
Development guide and workflows:
- Docker development environment
- Local development setup
- Building and running services
- Environment variables configuration
- Database management
- Testing procedures
- Frontend configuration
- Code style guidelines

### [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
Common issues and solutions:
- Port conflicts
- Database connection errors
- CORS issues
- Service connectivity problems
- Environment variable issues
- Debugging techniques
- Log analysis
- Performance optimization

## Quick Navigation

**Getting Started**: See main [README.md](../README.md) for quick start instructions.

**API Development**: Start with [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system, then refer to [API.md](API.md) for endpoint details.

**Frontend Development**: Check [DEVELOPMENT.md](DEVELOPMENT.md) for environment setup and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common frontend issues.

**Security Concerns**: Review [SECURITY.md](SECURITY.md) for authentication flow and best practices.

**Production Deployment**: Refer to [SECURITY.md](SECURITY.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for production-ready configuration.

## Key Architectural Decisions

### Comment API Direct Access

The Comment API (port 5003) is accessed directly by the frontend, not through the API Gateway. This design decision:
- Enables independent scaling of the comment service
- Supports event-driven architecture with RabbitMQ
- Reduces load on the API Gateway
- Allows for specialized performance optimization

See [ARCHITECTURE.md](ARCHITECTURE.md) and [API.md](API.md) for detailed information.

### Event-Driven Comment Processing

Comments are processed asynchronously via RabbitMQ:
- Write operations publish events to RabbitMQ
- Consumer service persists changes to PostgreSQL
- Ensures eventual consistency
- Enables audit trail and replay capabilities

### Separate Databases Per Service

Each microservice has its own database:
- `authdb`: Credentials storage
- `userdb`: User profiles and roles
- `ticketdb`: Tickets and comments

This separation:
- Enables independent scaling
- Improves fault isolation
- Allows service-specific optimizations
- Follows microservices best practices

## Contributing to Documentation

When updating documentation:
1. Keep language professional and clear
2. Include code examples where helpful
3. Update all related documents for consistency
4. Test all command examples
5. Add troubleshooting entries for new issues discovered
6. Update this README if adding new documentation files
