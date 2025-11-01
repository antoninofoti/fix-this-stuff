# Fix This Stuff - Ticket Management System

A comprehensive microservices-based platform for managing technical support tickets, developer resources, and collaborative problem-solving.

## Quick Links

**Detailed Documentation:**
- [Architecture](documentation/ARCHITECTURE.md) - System design and technology stack
- [API Reference](documentation/API.md) - Complete API endpoint documentation
- [Security](documentation/SECURITY.md) - Authentication, authorization, and security measures
- [Development Guide](documentation/DEVELOPMENT.md) - Local development and testing
- [Troubleshooting](documentation/TROUBLESHOOTING.md) - Common issues and solutions

## Overview

Fix This Stuff is a modern ticket management system built with a microservices architecture, featuring:

- **JWT-based authentication** with role-based access control (developer, moderator, admin)
- **Real-time comment system** using RabbitMQ event streaming
- **RESTful API Gateway** for centralized routing and security (Spring Boot)
- **Containerized deployment** with Docker Compose
- **Vue.js frontend** with responsive Bootstrap UI
- **Separate PostgreSQL databases** per service for data isolation

## Technology Stack

**Backend:**
- Spring Boot (API Gateway)
- Node.js/Express (Auth, User, Ticket services)
- Python/Flask (Comment API)
- PostgreSQL (separate databases per service)
- RabbitMQ (message broker)

**Frontend:**
- Vue.js 3 with Composition API
- Pinia (state management)
- Vue Router
- Bootstrap 5
- Vite

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)

For detailed architecture information, see [Architecture Documentation](documentation/ARCHITECTURE.md).

## Getting Started

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)
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
- **Frontend**: http://localhost
- **API Gateway**: http://localhost:8081
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **pgAdmin**: http://localhost:8080 (admin@example.com/admin)

### Default Admin Account

- **Username**: admin
- **Password**: admin123

**Important**: Use `admin` as the email field when logging in. The system stores this as the username in the credentials table.

**Change the default password immediately in production!**

### Quick API Test

```bash
# Register a user
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | jq -r '.token')

# Create a ticket
curl -X POST http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Issue","description":"Testing the API","category":1,"priority":"high"}'

# Add a comment (Note: Comment API is on port 5003, not through gateway)
curl -X POST http://localhost:5003/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":1,"comment_text":"This is a test comment"}'
```

## Documentation

- **[Architecture](documentation/ARCHITECTURE.md)** - System design, services, and technology stack
- **[API Reference](documentation/API.md)** - Complete API endpoint documentation with examples
- **[Security](documentation/SECURITY.md)** - Authentication, authorization, and security best practices
- **[Development Guide](documentation/DEVELOPMENT.md)** - Local development, testing, and workflows
- **[Troubleshooting](documentation/TROUBLESHOOTING.md)** - Common issues and debugging techniques

## Project Status

### Completed Features

- Core microservices architecture
- JWT authentication and authorization
- User management with role-based access control
- Ticket CRUD operations
- API Gateway with routing and security
- Backend comment system with RabbitMQ
- Frontend authentication and user management
- Frontend ticket management
- Docker containerization
- Comprehensive documentation

### In Progress

- Frontend comment interface (backend complete)

### Known Limitations

- Comment system frontend UI not yet implemented
- Real-time notifications not available
- File attachments not supported
- Email notifications not implemented

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is provided as-is for educational purposes.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the [Troubleshooting Guide](documentation/TROUBLESHOOTING.md)
- Review the [Development Guide](documentation/DEVELOPMENT.md)

---

**Useful Scripts:**

```bash
# Create additional admin user
./scripts/create-admin-user.sh newadmin@example.com secure_password

# View all service logs
docker compose logs -f

# Reset all databases
docker compose down -v && docker compose up -d

# Run integration tests
./scripts/test-all.sh
```
