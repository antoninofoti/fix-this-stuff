# Fix This Stuff Project

A microservices-based system for managing technical support tickets and developers.

## Services

### Auth Service
- Authentication and authorization
- Credential management
- System configuration

### User Service
- User management (developers)
- User skills management

### Ticket Service
- Ticket management
- Topic management
- Comment management

## Architecture

This project follows a microservices architecture with separate databases for each service. Communication between services is handled via REST APIs.

## Default Admin Account

The system comes with a default admin account that is created automatically when the containers are first started:

- **Email**: admin@fixthisstuff.com
- **Password**: admin123

You can override these defaults by setting environment variables before running docker-compose:

```bash
export ADMIN_EMAIL=your.admin@example.com
export ADMIN_PASSWORD=your_secure_password
docker-compose up
```

For security in production, it's strongly recommended to change the default admin password after first login.

## Development

To run the services locally:

```bash
docker-compose up
```

### Creating Additional Admin Users

If you need to create an additional admin user manually:

```bash
# Syntax: ./scripts/create-admin-user.sh [email] [password]
./scripts/create-admin-user.sh newadmin@example.com secure_password
```
