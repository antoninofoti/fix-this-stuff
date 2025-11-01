# Troubleshooting Guide

This guide covers common issues and their solutions.

## Common Issues

### Port Already in Use

**Symptoms**: Error starting containers with "bind: address already in use"

**Cause**: Another application is using required ports (80, 8081, 3001-3003, 5432, 5672, 15672, 5003, 8080)

**Solution**: 
```bash
# Check what's using a port
sudo lsof -i :8081

# Stop conflicting service or change ports in docker-compose.yml
docker compose down
# Kill the process, then restart
docker compose up -d
```

### Error 500 During Registration

**Symptoms**: Registration fails with HTTP 500

**Cause**: Database schema inconsistency or database not initialized

**Solution**: 
```bash
# Check initialization scripts ran
docker compose logs postgres | grep "init-scripts"

# Recreate database if needed
docker compose down -v
docker compose up -d
```

### CORS Errors in Browser

**Symptoms**: 
- "Access to XMLHttpRequest blocked by CORS policy"
- "No 'Access-Control-Allow-Origin' header"
- "Response to preflight request doesn't pass"

**Solutions**:

1. **For development on non-standard ports**: Update `CorsConfig.java`:
```java
config.setAllowedOrigins(Arrays.asList(
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:8080"
));
```

2. **For HTTP 405 on OPTIONS**: Verify `AuthFilter.java` bypasses OPTIONS:
```java
if ("OPTIONS".equals(exchange.getRequest().getMethod().toString())) {
    return chain.filter(exchange);
}
```

3. **For HTTP 403**: Check origin exactly matches (protocol and port):
```bash
curl -X OPTIONS http://localhost:8081/api/auth/register \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Cannot Connect to Microservices

**Symptoms**: API Gateway returns 500, logs show "Connection refused"

**Cause**: Services not on same Docker network

**Solution**: 
```bash
# Verify network
docker network inspect fix-this-stuff_fts-network

# Check service health
docker compose ps
```

### RabbitMQ Connection Refused

**Symptoms**: Comment service fails to connect to RabbitMQ

**Cause**: RabbitMQ not ready when consumers start

**Solution**: 
```bash
# Wait 10-15 seconds for initialization
# Check RabbitMQ status
docker compose logs rabbitmq

# Verify connection
docker exec -it rabbitmq rabbitmqctl status
```

### Database Connection Errors

**Symptoms**: Services fail with "ECONNREFUSED" or "authentication failed"

**Solution**:
```bash
# Check PostgreSQL is running
docker compose ps postgres
docker compose logs postgres

# Verify databases were created
docker exec -it postgres psql -U admin -l

# Test connection
docker exec -it postgres psql -U admin -d authdb
```

### Comment API Connection Issues

**Symptoms**: Unable to retrieve or create comments, 404 errors on comment endpoints

**Cause**: Incorrect endpoint URLs or Comment API not running

**Solution**:

1. **Verify Comment API is running**:
```bash
docker compose ps comment-api
docker compose logs comment-api

# Test health endpoint
curl http://localhost:5003/health
```

2. **Check endpoint paths**: Comment API endpoints do NOT include `/api` prefix:
```bash
# Correct
curl http://localhost:5003/tickets/1/comments
curl http://localhost:5003/comments -H "Authorization: Bearer $TOKEN"

# Incorrect
curl http://localhost:5003/api/comments
```

3. **Verify RabbitMQ connection**: Comment creation/updates are asynchronous via RabbitMQ:
```bash
docker compose logs rabbitmq
docker compose logs comments-service
```

4. **Check database**: Comments are stored in the ticket database:
```bash
docker exec -it postgres psql -U admin -d ticketdb
SELECT * FROM comment;
```

### Vite Environment Variables Not Working

**Symptoms**: Frontend makes requests to wrong URLs

**Cause**: Environment variables not set at build time

**Solution**:
```yaml
# Use build.args in docker-compose.yml
ui:
  build:
    context: ./ui
    args:
      VITE_AUTH_API_URL: http://localhost:8081/api/auth
```

### Ticket Creation Returns 400

**Symptoms**: "Category/system ID must be an integer" error

**Solution**: Use `v-model.number` in Vue forms:
```vue
<select v-model.number="category" class="form-select">
  <option value="1">System 1</option>
  <option value="2">System 2</option>
</select>
```

## Debugging

### Viewing Logs

```bash
# Individual service
docker compose logs -f auth-service

# Multiple services
docker compose logs -f auth-service user-service

# All services
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100 auth-service
```

### Debugging Inside Containers

```bash
# Access bash shell
docker exec -it auth-service bash

# Check process
docker exec -it auth-service ps aux | grep node

# View environment
docker exec -it auth-service env | grep DB_

# Test connectivity
docker exec -it api-gateway ping auth-service
```

### Network Debugging

```bash
# List networks
docker network ls

# Inspect network
docker network inspect fix-this-stuff_fts-network

# Find service IPs
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' auth-service
```

### Database Debugging

```bash
# Connect to database
docker exec -it postgres psql -U admin -d authdb

# Useful commands
\l              # List databases
\dt             # List tables
\d users        # Describe table
SELECT * FROM users;  # Query data
```

### API Gateway Debugging

Enable debug logging:
```bash
# Edit application.properties
logging.level.com.example=DEBUG
logging.level.org.springframework.web=DEBUG

# Rebuild and restart
docker compose up -d --build api-gateway
docker compose logs -f api-gateway
```

### Frontend Debugging

```bash
# View build output
docker compose logs ui

# Check nginx config
docker exec -it ui-frontend cat /etc/nginx/nginx.conf

# View nginx logs
docker exec -it ui-frontend tail -f /var/log/nginx/access.log
```

For local development:
```bash
cd ui
npm run dev
# Open browser console (F12)
```

### Performance Debugging

```bash
# Monitor resources
docker stats

# Test endpoint performance
time curl -X GET http://localhost:8081/api/tickets \
  -H "Authorization: Bearer $TOKEN"

# Load testing
ab -n 100 -c 10 http://localhost:8081/api/tickets
```

## Getting Help

If you encounter issues not covered here:

1. Check service logs for error messages
2. Verify all containers are running: `docker compose ps`
3. Test network connectivity between services
4. Review environment variables configuration
5. Check database schema is properly initialized
6. Verify JWT_SECRET matches across services
