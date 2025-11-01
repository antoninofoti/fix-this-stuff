# API Documentation

## Authentication Endpoints

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "developer"
  },
  "credentialId": 1
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "developer"
  }
}
```

## Ticket Endpoints

All ticket endpoints require authentication via Bearer token.

### Create Ticket
```bash
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Cannot connect to database",
  "description": "Getting connection timeout errors when trying to access the database",
  "category": 1,
  "priority": "high"
}
```

**Required Fields:**
- `title` (string): Brief description of the issue
- `description` (string): Detailed explanation of the problem
- `category` (integer): System/category ID (1-5)
- `priority` (string): One of "low", "medium", "high"

**Response:**
```json
{
  "message": "Ticket created successfully",
  "ticket": {
    "id": 5,
    "title": "Cannot connect to database",
    "priority": "high",
    "flag_status": "open",
    "solve_status": "not_solved",
    "request_author_id": 4,
    "system_id": 1,
    "opening_date": "2025-10-31T10:34:41.000Z",
    "deadline_date": "2025-11-07T10:34:41.000Z"
  }
}
```

### List Tickets
```bash
GET /api/tickets
Authorization: Bearer <token>
```

### Get Ticket Details
```bash
GET /api/tickets/:ticketId
Authorization: Bearer <token>
```

### Update Ticket
```bash
PUT /api/tickets/:ticketId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "medium",
  "status": "in_progress"
}
```

### Delete Ticket
```bash
DELETE /api/tickets/:ticketId
Authorization: Bearer <token>
```

## User Endpoints

### List Users (Admin only)
```bash
GET /api/users
Authorization: Bearer <token>
```

### Get User Details
```bash
GET /api/users/:userId
Authorization: Bearer <token>
```

### Update User Profile
```bash
PUT /api/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

### Update User Role (Admin only)
```bash
PATCH /api/users/:userId/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "moderator"
}
```

### Delete User (Admin only)
```bash
DELETE /api/users/:userId
Authorization: Bearer <token>
```

## Comment Endpoints

**Note:** Comment endpoints are accessed directly via the Comment API on port 5003, not through the API Gateway. This is an architectural decision to allow the comment system to scale independently.

### Get Comments for Ticket
```bash
GET http://localhost:5003/tickets/:ticketId/comments
```

**Authentication:** Not required (read-only)

**Response:**
```json
[
  {
    "id": 1,
    "ticket_id": 1,
    "author_id": 2,
    "comment_text": "This issue is related to network configuration",
    "creation_date": "2025-10-30 14:23"
  }
]
```

### Add Comment
```bash
POST http://localhost:5003/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "ticket_id": 1,
  "comment_text": "I have the same problem"
}
```

**Authentication:** Required

**Response:**
```json
{
  "message": "Comment submitted successfully to RabbitMQ"
}
```

**Note:** Comments are processed asynchronously via RabbitMQ. The comment will appear after the consumer processes the event (typically within 1-2 seconds).

### Update Comment
```bash
PUT http://localhost:5003/comments/:commentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment_text": "Updated comment text"
}
```

**Authentication:** Required

**Response:**
```json
{
  "message": "Comment update request successfully submitted to rabbitMQ"
}
```

**Note:** Only the comment author can update their own comments. The update is processed asynchronously via RabbitMQ.

### Delete Comment
```bash
DELETE http://localhost:5003/comments/:commentId
Authorization: Bearer <token>
```

**Authentication:** Required

**Response:**
```json
{
  "message": "Comment delete request successfully submitted to rabbitMQ"
}
```

**Note:** Only the comment author or administrators can delete comments. The deletion is processed asynchronously via RabbitMQ.

## Role Endpoints

### List Available Roles
```bash
GET /api/roles
Authorization: Bearer <token>
```

**Response:**
```json
{
  "roles": ["developer", "moderator", "admin"]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": ["Email is required", "Password must be at least 8 characters"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```
