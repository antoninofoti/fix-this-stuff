# Documentation Structure

This directory contains comprehensive documentation for the Fix This Stuff ticket management system. The documentation is organized to support developers, system administrators, and end users.

## Available Documentation

### [ARCHITECTURE.md](ARCHITECTURE.md)
Complete system architecture documentation covering the microservices design pattern, technology stack, and component interactions.

**Contents:**
- System component diagram and data flow
- Microservices architecture pattern
- Technology stack details (Spring Boot, Node.js, Python, Vue.js)
- Service responsibilities and communication patterns
- Database schema overview (multi-database strategy)
- Message queue architecture (RabbitMQ)

**Use when:** Understanding system design, planning modifications, or troubleshooting service communication issues.

### [API.md](API.md)
Complete REST API reference with detailed endpoint documentation and examples.

**Contents:**
- Authentication endpoints (registration, login, token validation)
- Ticket management endpoints (CRUD operations, search, assignment)
- User management endpoints (profile, roles, search)
- Comment system endpoints (asynchronous processing)
- Resolution workflow endpoints (request, approve, reject)
- Request and response examples with sample payloads
- Error response formats and status codes

**Use when:** Integrating with the API, debugging requests, or developing new features.

### [SECURITY.md](SECURITY.md)
Security architecture, authentication mechanisms, and best practices for secure deployment.

**Contents:**
- JWT authentication flow and token lifecycle
- Security measures by system layer
- Role-Based Access Control (RBAC) implementation
- CORS configuration for frontend integration
- Default credentials and initial setup
- Production security best practices
- Threat model considerations and mitigation strategies

**Use when:** Configuring security settings, deploying to production, or conducting security audits.

### [DEVELOPMENT.md](DEVELOPMENT.md)
Comprehensive development guide covering setup, workflows, and best practices.

**Contents:**
- Docker-based development environment setup
- Local development configuration (frontend and backend)
- Building and running individual services
- Environment variables configuration
- Database management and migrations
- Testing procedures and debugging techniques
- Frontend development with Vite hot-reload
- Code style guidelines and conventions

**Use when:** Setting up development environment, making code changes, or running tests.

### [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
Common operational issues and their solutions for both deployment and development scenarios.

**Contents:**
- Service startup and connectivity issues
- Database connection troubleshooting
- Authentication and authorization problems
- Message queue (RabbitMQ) issues
- Frontend deployment issues
- Diagnostic tools and commands
- Recovery procedures for system reset
- Performance optimization tips

**Use when:** Debugging runtime issues, resolving deployment problems, or performing system diagnostics.

### [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)
Detailed guide for frontend implementation, focusing on the ticket resolution workflow and leaderboard features.

**Contents:**
- Vue.js component architecture
- API client implementation patterns
- State management with Pinia
- Resolution workflow UI components
- Leaderboard implementation
- Role-based UI rendering
- Best practices for Vue 3 Composition API

**Use when:** Developing frontend features, implementing new UI components, or integrating with backend APIs.

### [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
High-level overview of the ticket resolution system and leaderboard implementation.

**Contents:**
- Implementation objectives and scope
- Database schema changes for resolution workflow
- Backend service modifications
- Frontend component implementation
- Points calculation and leaderboard logic
- Testing and validation procedures

**Use when:** Understanding the resolution workflow feature, reviewing implementation decisions, or planning similar features.

### [TICKET_RESOLUTION_WORKFLOW.md](TICKET_RESOLUTION_WORKFLOW.md)
Detailed specification of the ticket resolution approval process and points system.

**Contents:**
- Resolution workflow state diagram
- Role-based permissions for each workflow step
- Points calculation algorithm
- Approval and rejection process
- Leaderboard ranking system
- Integration with existing ticket lifecycle

**Use when:** Understanding the resolution approval process, implementing workflow changes, or troubleshooting resolution issues.

### Additional Resources

The documentation directory also contains supplementary materials:

- **[UserStories.xlsx](UserStories.xlsx)**: Comprehensive user stories and requirements documentation
- **[FunctionPointsAnalysis.xlsx](FunctionPointsAnalysis.xlsx)**: Function points analysis for project estimation
- **[FixThisStuff_Mockups.pdf](FixThisStuff_Mockups.pdf)**: UI/UX mockups and design specifications
- **[CocomoII.png](CocomoII.png)**: COCOMO II software cost estimation diagram
- **[DataMetrics.json](DataMetrics.json)**: Project metrics and statistical data

## Quick Start Guide

### For New Developers
1. Start with the main [README.md](../README.md) in the project root for project overview
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
3. Follow [DEVELOPMENT.md](./DEVELOPMENT.md) to set up your development environment
4. Review [API.md](./API.md) for detailed endpoint documentation
5. Consult [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) for UI development

### For System Administrators
1. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
2. Study [SECURITY.md](./SECURITY.md) before deploying to production
3. Keep [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) accessible for operational issues
4. Consult [API.md](./API.md) for monitoring and health check endpoints

### For API Integrators
1. Start with [API.md](./API.md) for comprehensive endpoint reference
2. Review [SECURITY.md](./SECURITY.md) for authentication requirements
3. Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for understanding system constraints and data flow

### For Product Managers
1. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for feature overview
2. Review [TICKET_RESOLUTION_WORKFLOW.md](./TICKET_RESOLUTION_WORKFLOW.md) for workflow details
3. Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for technical understanding

## Documentation Maintenance

When making system changes, please update the relevant documentation:

- **API Changes**: Update [API.md](./API.md) with new endpoints or modified parameters
- **Architecture Changes**: Update [ARCHITECTURE.md](./ARCHITECTURE.md) with component modifications
- **Security Changes**: Update [SECURITY.md](./SECURITY.md) with new security measures
- **Development Process**: Update [DEVELOPMENT.md](./DEVELOPMENT.md) with new workflows or tools
- **Common Issues**: Add solutions to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) as they are discovered

## Additional Resources

- **Source Code**: Available in the parent directory
- **Docker Configuration**: See `docker-compose.yml` in project root
- **Database Initialization**: See `init-scripts/` directory
- **Frontend Application**: See `ui/` directory
- **Microservices**: See `auth-service/`, `user-service/`, `ticket-service/` directories

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
