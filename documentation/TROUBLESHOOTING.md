# Troubleshooting Guide

This guide covers common issues and solutions for operating and developing with the Fix This Stuff ticketing system.

## Common Issues

### Services Fail to Start

**Symptoms**: Container exits immediately or fails to start

**Cause**: Port conflicts, missing dependencies, or configuration errors

**Solution**: 
```bash
# Check service status
docker compose ps

# View service logs
docker compose logs <service-name>

# Stop all services and restart
docker compose down
docker compose up -d

# Check for port conflicts
sudo netstat -tulpn | grep <port-number>
```

### Database Connection Errors

**Symptoms**: Services fail with connection errors or authentication failures

**Cause**: Database not ready, incorrect credentials, or network issues

**Solution**:
```bash
# Check PostgreSQL is running
docker compose ps postgres
docker compose logs postgres

# Verify databases were created
docker exec -it postgres psql -U admin -l

# Test connection manually
docker exec -it postgres psql -U admin -d authdb

# Ensure services are on the same network
docker network inspect fix-this-stuff_fts-network
```

### Authentication Issues

**Symptoms**: Login fails, token validation errors, or 401 Unauthorized responses

**Cause**: Incorrect credentials, expired tokens, or JWT secret mismatch

**Solution**: 
```bash
# Verify default admin credentials
# Email: admin@fixthisstuff.com
# Password: admin123

# Check JWT_SECRET is consistent across services
docker compose exec auth-service env | grep JWT_SECRET
docker compose exec user-service env | grep JWT_SECRET

# Verify token in browser localStorage (F12 > Application > Local Storage)

# Test login endpoint directly
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fixthisstuff.com","password":"admin123"}'
```

### Network Connectivity Issues

**Symptoms**: Services cannot communicate, API Gateway returns connection errors

**Cause**: Services not on the same Docker network or incorrect hostnames

**Solution**: 
```bash
# Verify network configuration
docker network inspect fix-this-stuff_fts-network

# Check service health
docker compose ps

# Ensure services can ping each other
docker exec -it api-gateway ping auth-service
docker exec -it auth-service ping postgres

# Restart all services
docker compose down
docker compose up -d
```

### Message Queue Issues

**Symptoms**: Comments not being processed, RabbitMQ connection errors

**Cause**: RabbitMQ not ready, queue configuration issues, or consumer not running

**Solution**: 
```bash
# Check RabbitMQ status
docker compose logs rabbitmq
docker compose ps rabbitmq

# Verify queue status via management UI
# Open http://localhost:15672 (guest/guest)

# Check consumer is running
docker compose logs comments-service

# Verify connection
docker exec -it rabbitmq rabbitmqctl status
docker exec -it rabbitmq rabbitmqctl list_queues

# Restart consumers
docker compose restart comments-service
```

### Comment System Issues

**Symptoms**: Comments not appearing, creation errors, or retrieval failures

**Cause**: Comment API not running, RabbitMQ queue issues, or database problems

**Solution**:
```bash
# Verify Comment API is running
docker compose ps comment-api
docker compose logs comment-api

# Check RabbitMQ queue for pending messages
docker exec -it rabbitmq rabbitmqctl list_queues

# Verify comments consumer is processing
docker compose logs comments-service

# Check comments in database
docker exec -it postgres psql -U admin -d ticketdb -c "SELECT * FROM comment LIMIT 10;"

# Restart comment services
docker compose restart comment-api comments-service
```

### Frontend Not Loading

**Symptoms**: Blank page, 404 errors, or cannot access UI

**Cause**: Nginx not running, build errors, or incorrect configuration

**Solution**:
```bash
# Check UI container status
docker compose ps ui
docker compose logs ui

# Verify Nginx is serving files
docker exec -it ui ls /usr/share/nginx/html

# Check Nginx configuration
docker exec -it ui cat /etc/nginx/conf.d/default.conf

# Rebuild frontend
docker compose up -d --build ui

# Access at http://localhost or http://localhost:80
```

### API Returns Unexpected Errors

**Symptoms**: 500 Internal Server Error, undefined responses, or timeout errors

**Cause**: Backend service crashes, database query errors, or missing data

**Solution**:
```bash
# Check specific service logs
docker compose logs api-gateway
docker compose logs ticket-service
docker compose logs auth-service

# Verify database schema is initialized
docker exec -it postgres psql -U admin -d ticketdb -c "\dt"

# Check for database initialization errors
docker compose logs postgres | grep ERROR

# Restart problematic service
docker compose restart <service-name>
```

## Diagnostic Tools

### Viewing Logs

```bash
# View logs for a specific service
docker compose logs -f <service-name>

# View logs for multiple services
docker compose logs -f auth-service user-service

# View all service logs
docker compose logs -f

# Show last 100 lines
docker compose logs --tail=100 <service-name>

# Search for errors
docker compose logs | grep -i error
```

### Checking Service Health

```bash
# List all services and their status
docker compose ps

# Check resource usage
docker stats

# Inspect specific container
docker inspect <container-name>

# Check if service is responding
curl -I http://localhost:8081/api/tickets
```

### Database Inspection

```bash
# Connect to database
docker exec -it postgres psql -U admin -d <database-name>

# Useful PostgreSQL commands:
\l                    # List all databases
\c <database>         # Connect to database
\dt                   # List tables
\d <table>            # Describe table structure
SELECT * FROM users;  # Query data
\q                    # Quit
```

### Network Inspection

```bash
# List Docker networks
docker network ls

# Inspect application network
docker network inspect fix-this-stuff_fts-network

# Find container IP addresses
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container-name>

# Test connectivity between services
docker exec -it api-gateway ping auth-service
```

## Recovery Procedures

### Complete System Reset

If the system is in an unrecoverable state:

```bash
# Stop all services
docker compose down

# Remove all containers and volumes (WARNING: deletes all data)
docker compose down -v

# Remove unused Docker resources
docker system prune -a

# Rebuild and start fresh
docker compose up -d --build

# Verify all services are running
docker compose ps
```

### Database Reset

To reset only the database:

```bash
# Stop services
docker compose down

# Remove only database volume
docker volume rm fix-this-stuff_postgres-data

# Restart (init scripts will run again)
docker compose up -d postgres

# Wait for initialization, then start other services
sleep 15
docker compose up -d
```

### Service-Specific Restart

To restart a single problematic service:

```bash
# Restart service
docker compose restart <service-name>

# Rebuild and restart service
docker compose up -d --build <service-name>

# View logs after restart
docker compose logs -f <service-name>
```

## Performance Issues

### Slow Response Times

**Cause**: Resource constraints, inefficient queries, or network latency

**Solution**:
```bash
# Monitor resource usage
docker stats

# Check for slow queries in PostgreSQL
docker exec -it postgres psql -U admin -d ticketdb -c \
  "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Increase container resources in docker-compose.yml
# Add under service definition:
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

### High Memory Usage

**Cause**: Memory leaks, too many containers, or insufficient host resources

**Solution**:
```bash
# Check memory usage
docker stats --no-stream

# Restart high-memory service
docker compose restart <service-name>

# Check host system resources
free -h
df -h

# Clean up Docker system
docker system prune -a
```

## Advanced Debugging

### Debugging Inside Containers

Execute commands inside running containers for in-depth troubleshooting:

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

### Network Debugging

Inspect Docker networks and service connectivity:

```bash
# List networks
docker network ls

# Inspect fts-network
docker network inspect fix-this-stuff_fts-network

# Find service IPs
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' auth-service

# Test connectivity between services
docker exec -it api-gateway ping user-service
docker exec -it ticket-service curl http://auth-service:3001/health
```

### Database Debugging

Access PostgreSQL directly for detailed database inspection:

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

# Check ticket data
\c ticketdb
SELECT id, title, flag_status, solve_status FROM ticket LIMIT 10;
```

### API Gateway Debugging

Enable debug logging in API Gateway:

```bash
# Edit application.properties or application-docker.properties
logging.level.com.example=DEBUG
logging.level.org.springframework.web=DEBUG

# Rebuild and restart
docker compose up -d --build api-gateway
docker compose logs -f api-gateway
```

### Frontend Debugging

Access frontend build logs and nginx configuration:

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

### Performance Debugging

Monitor container resource usage and service performance:

```bash
# Real-time stats
docker stats

# Specific containers
docker stats auth-service user-service api-gateway

# Test endpoint performance
time curl -X GET http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN"

# Use Apache Bench for load testing
ab -n 100 -c 10 http://localhost:8081/api/tickets
```

### Vite Environment Variables Not Working

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
      VITE_USER_API_URL: http://localhost:8081/api/users
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

**Important**: Vite requires variables at build time, not runtime. Always use `build.args` in docker-compose.yml, not `environment`.

## Prevention Best Practices

### Regular Maintenance

- Monitor logs regularly for errors
- Check disk space usage periodically
- Update dependencies and images regularly
- Backup database volumes before major changes
- Test changes in development environment first

### Monitoring Recommendations

- Set up log aggregation for production
- Monitor service health endpoints
- Track database performance metrics
- Set up alerts for service failures
- Monitor RabbitMQ queue depths

### Backup Strategy

```bash
# Backup database volumes
docker run --rm -v fix-this-stuff_postgres-data:/data \
  -v $(pwd)/backups:/backup alpine \
  tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz /data

# Backup configuration files
tar czf config-backup-$(date +%Y%m%d).tar.gz docker-compose.yml .env init-scripts/
```

## Getting Help

If you encounter issues not covered in this guide:

1. Check service logs for detailed error messages
2. Verify all containers are running: `docker compose ps`
3. Test network connectivity between services
4. Review configuration files for errors
5. Check database schema is properly initialized
6. Ensure environment variables are correctly set
7. Consult the DEVELOPMENT.md and ARCHITECTURE.md documentation
8. Search for similar issues in the project repository

For persistent issues, gather the following information:
- Full error messages from logs
- Output of `docker compose ps`
- Output of `docker compose logs <problematic-service>`
- Steps to reproduce the issue
- Recent changes made to the system

