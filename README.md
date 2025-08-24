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
- **Moderator management** (migrated from auth-service on May 19, 2025)

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

## Recent Changes

- **May 19, 2025**: Performed code cleanup to eliminate redundant code and fix inconsistencies. See `docs/code-cleanup-summary.md` for details.
- **May 19, 2025**: Added default admin user creation during container startup
- **May 19, 2025**: Migrated moderator functionality from auth-service to user-service. See `scripts/moderator-migration-doc.md` for details.

## Database Migration

If you need to migrate moderator data from the auth-service to the user-service:

```bash
node scripts/migrate-moderators.js
```
