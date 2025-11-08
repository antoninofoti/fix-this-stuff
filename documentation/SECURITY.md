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

### Authentication and Authorization

1. **Never commit secrets**: Use environment variables for sensitive data (JWT_SECRET, database passwords)
2. **Rotate JWT secrets**: Change `JWT_SECRET` regularly in production environments
3. **Token expiration**: JWT tokens expire after 24 hours; implement refresh token mechanism for production
4. **Strong password policy**: Enforce minimum 8 characters with complexity requirements
5. **Account lockout**: Implement account lockout after multiple failed login attempts
6. **Session management**: Clear tokens on logout and after password changes

### Network Security

1. **Use HTTPS**: Always use TLS/SSL certificates in production environments
2. **Firewall configuration**: Restrict database and RabbitMQ ports to internal network only
3. **Reverse proxy**: Use Nginx or similar for SSL termination and request filtering
4. **Rate limiting**: Implement rate limiting to prevent brute force and DDoS attacks
5. **IP whitelisting**: Consider IP restrictions for admin endpoints
6. **Network segmentation**: Isolate services in separate network zones when possible

### Data Protection

1. **Encryption at rest**: Enable PostgreSQL transparent data encryption (TDE)
2. **Encryption in transit**: Use SSL for database connections
3. **Data retention**: Implement data retention policies and automatic cleanup
4. **Backup encryption**: Encrypt database backups before storage
5. **Sensitive data masking**: Mask sensitive fields in logs and error messages
6. **PII protection**: Handle personally identifiable information according to regulations (GDPR, CCPA)

### Application Security

1. **Input validation**: Validate and sanitize all user inputs on both frontend and backend
2. **SQL injection prevention**: Use parameterized queries exclusively (never string concatenation)
3. **XSS protection**: Sanitize HTML content and use Vue.js text interpolation (not v-html)
4. **CSRF protection**: Implement CSRF tokens for state-changing operations
5. **Dependency scanning**: Regularly scan and update dependencies for vulnerabilities
6. **Error handling**: Never expose stack traces or internal details to clients
7. **Logging**: Log security events (failed logins, authorization failures, suspicious activity)

### Production Security Checklist

Before deploying to production, ensure the following:

- [ ] Change default admin credentials
- [ ] Use strong, unique JWT_SECRET
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall to restrict internal ports (5432, 5672, 3001-3003)
- [ ] Implement rate limiting on authentication endpoints
- [ ] Enable database connection SSL/TLS
- [ ] Set up automated backup with encryption
- [ ] Configure log aggregation and monitoring
- [ ] Implement intrusion detection system (IDS)
- [ ] Set up security alerts for anomalous activity
- [ ] Review and update CORS allowed origins
- [ ] Disable debug logging in production
- [ ] Use environment-specific configurations
- [ ] Implement secrets management (HashiCorp Vault, AWS Secrets Manager)
- [ ] Set up regular security audits and penetration testing

## Threat Model

### Identified Threats and Mitigations

#### 1. Unauthorized Access

**Threat**: Attackers attempt to access system without valid credentials

**Mitigations**:
- JWT token validation on all protected endpoints
- bcrypt password hashing (10 rounds) prevents rainbow table attacks
- Role-based access control limits privilege escalation
- Account lockout after failed login attempts (recommended implementation)

#### 2. Token Theft

**Threat**: JWT tokens stolen via XSS or network interception

**Mitigations**:
- HttpOnly cookies for token storage (alternative to localStorage)
- Short token expiration (24 hours)
- HTTPS in production prevents network interception
- Content Security Policy (CSP) headers reduce XSS risk

#### 3. SQL Injection

**Threat**: Malicious SQL code injected through user inputs

**Mitigations**:
- Parameterized queries used throughout codebase
- ORM pattern separates data from queries
- Input validation on all endpoints
- Database user permissions limited to necessary operations

#### 4. Cross-Site Scripting (XSS)

**Threat**: Malicious scripts injected into web pages

**Mitigations**:
- Vue.js automatic escaping for text interpolation
- Avoid v-html directive usage
- Content Security Policy headers
- Input sanitization on backend

#### 5. Cross-Site Request Forgery (CSRF)

**Threat**: Unauthorized commands transmitted from trusted user

**Mitigations**:
- CORS configuration restricts origins
- JWT tokens in Authorization header (not cookies)
- SameSite cookie attribute (if using cookies)
- CSRF tokens for sensitive operations (recommended)

#### 6. Denial of Service (DoS)

**Threat**: System overwhelmed with requests

**Mitigations**:
- Rate limiting on API endpoints (recommended implementation)
- Database connection pooling prevents connection exhaustion
- Nginx request buffering and timeouts
- RabbitMQ queue limits prevent memory exhaustion
- Resource limits in Docker containers

#### 7. Data Breach

**Threat**: Unauthorized access to sensitive data

**Mitigations**:
- Passwords never stored in plain text (bcrypt hashing)
- Multi-database architecture limits blast radius
- Role-based access control enforces least privilege
- Audit logging tracks data access
- Database backups encrypted

#### 8. Man-in-the-Middle (MITM)

**Threat**: Attacker intercepts communication between client and server

**Mitigations**:
- HTTPS/TLS encryption for all production traffic
- SSL certificates from trusted CA
- HTTP Strict Transport Security (HSTS) headers
- Certificate pinning for mobile apps (future)

## Security Incident Response

### Detection

Monitor for the following security indicators:

- Unusual number of failed login attempts
- Unexpected geographic locations for logins
- High volume of requests from single IP
- Database query errors or unusual patterns
- Unauthorized role changes
- Large data exports or deletions
- Service disruptions or performance degradation

### Response Procedure

1. **Identify**: Detect and confirm security incident
2. **Contain**: Isolate affected systems, revoke compromised tokens
3. **Eradicate**: Remove threat, patch vulnerabilities
4. **Recover**: Restore services, verify integrity
5. **Review**: Post-incident analysis and improvements

### Incident Checklist

- [ ] Document incident details (time, scope, impact)
- [ ] Preserve logs and evidence
- [ ] Revoke all active JWT tokens (change JWT_SECRET)
- [ ] Reset compromised user passwords
- [ ] Review access logs for unauthorized activity
- [ ] Patch vulnerabilities that led to incident
- [ ] Notify affected users if data was compromised
- [ ] Update security measures to prevent recurrence
- [ ] Conduct post-incident review meeting

## Compliance Considerations

### GDPR (General Data Protection Regulation)

If serving EU users, ensure compliance with:

- **Right to Access**: Users can request their personal data
- **Right to Deletion**: Implement account and data deletion
- **Data Portability**: Allow users to export their data
- **Consent Management**: Obtain explicit consent for data processing
- **Data Breach Notification**: Notify within 72 hours of discovery

### Data Retention

Implement retention policies for:

- **User accounts**: Delete inactive accounts after specified period
- **Tickets**: Archive resolved tickets after specified period
- **Comments**: Retain with associated tickets
- **Logs**: Retain security logs for minimum period (e.g., 90 days)
- **Backups**: Rotate and delete old backups according to policy

### Audit Logging

Log security-relevant events:

- User authentication (success and failure)
- Authorization failures
- Role changes
- Ticket creation, modification, deletion
- Comment creation, modification, deletion
- Admin actions
- Database schema changes
- Configuration changes

## Security Tools and Recommendations

### Vulnerability Scanning

- **npm audit**: Scan Node.js dependencies for known vulnerabilities
- **OWASP Dependency-Check**: Multi-language dependency scanner
- **Snyk**: Continuous vulnerability monitoring
- **Trivy**: Container image vulnerability scanner

```bash
# Scan Node.js dependencies
cd auth-service && npm audit

# Scan with OWASP Dependency-Check
dependency-check --project "Fix This Stuff" --scan .

# Scan Docker images
trivy image fix-this-stuff-auth-service
```

### Security Headers

Implement recommended HTTP security headers:

```nginx
# Add to nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Penetration Testing

Regular security testing should include:

- **Automated scans**: OWASP ZAP, Burp Suite
- **Manual testing**: Authentication bypass, authorization flaws
- **API testing**: Postman collections with malicious payloads
- **Social engineering**: Phishing awareness training

### Security Monitoring

Implement monitoring for:

- Failed authentication attempts
- Authorization failures
- Unusual API usage patterns
- Database query errors
- Service errors and exceptions
- Resource utilization anomalies

**Recommended Tools**:
- **ELK Stack**: Elasticsearch, Logstash, Kibana for log aggregation
- **Prometheus + Grafana**: Metrics collection and visualization
- **Sentry**: Error tracking and monitoring

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [GDPR Official Text](https://gdpr-info.eu/)

