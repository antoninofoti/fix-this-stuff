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

**Response:**
```json
{
  "tickets": [
    {
      "id": 1,
      "title": "Cannot connect to database",
      "priority": "high",
      "status": "open",
      "created_at": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

### Search Tickets
Search for tickets by ID, title, description, category, status, or priority.

```bash
GET /api/tickets/search?query=database&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `query` (required): Search term (minimum 2 characters)
- `limit` (optional, default: 50): Maximum number of results to return

**Response:**
```json
{
  "tickets": [
    {
      "id": 5,
      "title": "Cannot connect to database",
      "description": "Getting connection timeout errors",
      "category": 1,
      "priority": "high",
      "status": "open",
      "created_by": 4,
      "assigned_to": null,
      "created_at": "2025-11-01T10:34:41.000Z"
    }
  ],
  "count": 1
}
```

**Search Behavior:**
- Case-insensitive partial matching
- Searches across: id, title, description, category, status, priority
- Returns empty array if no matches found
- Maximum 50 results by default (configurable via `limit` parameter)

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

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com",
      "role": "developer",
      "rank": "Bronze"
    }
  ]
}
```

### Search Users (Admin/Moderator only)
Search for users by name, surname, or email.

```bash
GET /api/users/search?query=john&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `query` or `q` (required): Search term (minimum 2 characters)
- `limit` (optional, default: 50): Maximum number of results to return

**Authentication:** Required (Admin or Moderator role)

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "email": "john.doe@example.com",
      "role": "developer",
      "rank": "Bronze",
      "points": 45,
      "created_at": "2025-10-15T09:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Search Behavior:**
- Case-insensitive partial matching
- Searches across: name, surname, email
- Requires Admin or Moderator role
- Returns empty array if no matches found
- Maximum 50 results by default (configurable via `limit` parameter)

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

## Ticket Resolution Workflow Endpoints

### Developer: Request Resolution Approval
Developer requests approval for a resolved ticket.

```bash
POST /api/tickets/:ticketId/request-resolution
Authorization: Bearer <token> (developer)
Content-Type: application/json
```

**Requirements:**
- User must be a developer
- Ticket must be assigned to the requesting developer
- Ticket cannot already be pending approval or solved

**Response:**
```json
{
  "message": "Resolution submitted for approval",
  "ticket": {
    "id": 5,
    "solve_status": "pending_approval",
    "resolved_by": 4,
    "resolved_at": "2025-11-07T14:30:00.000Z"
  }
}
```

### Moderator/Admin: Approve Resolution
Approve a pending resolution and award points to the developer.

```bash
POST /api/tickets/:ticketId/approve-resolution
Authorization: Bearer <token> (moderator or admin)
Content-Type: application/json
```

**Requirements:**
- User must be moderator or admin
- Ticket must have `solve_status: "pending_approval"`

**Response:**
```json
{
  "message": "Resolution approved successfully",
  "ticket": {
    "id": 5,
    "solve_status": "solved",
    "approved_by": 2,
    "approval_date": "2025-11-07T15:00:00.000Z"
  },
  "pointsAwarded": 15,
  "developerStats": {
    "developer_id": 4,
    "total_points": 145,
    "tickets_resolved": 12,
    "average_rating": 4.25
  }
}
```

**Points Calculation:**
- Base points: `high=10`, `medium=5`, `low=2`
- Bonus: If ticket has rating, add `rating × 2` points
- Example: High priority ticket (10) + rating 5 (10 bonus) = 20 points

### Moderator/Admin: Reject Resolution
Reject a pending resolution with a reason.

```bash
POST /api/tickets/:ticketId/reject-resolution
Authorization: Bearer <token> (moderator or admin)
Content-Type: application/json

{
  "reason": "Solution does not fully address the reported issue"
}
```

**Requirements:**
- User must be moderator or admin
- Ticket must have `solve_status: "pending_approval"`
- Reason is required

**Response:**
```json
{
  "message": "Resolution rejected",
  "ticket": {
    "id": 5,
    "solve_status": "not_solved",
    "rejection_reason": "Solution does not fully address the reported issue",
    "resolved_by": null,
    "resolved_at": null
  }
}
```

### Moderator/Admin: Get Pending Approvals
Get all tickets awaiting resolution approval.

```bash
GET /api/tickets/admin/pending-approval
Authorization: Bearer <token> (moderator or admin)
```

**Response:**
```json
{
  "tickets": [
    {
      "id": 5,
      "title": "Database connection issue",
      "priority": "high",
      "solve_status": "pending_approval",
      "resolved_by": 4,
      "resolved_at": "2025-11-07T14:30:00.000Z",
      "developer_name": "Mario Rossi",
      "author_name": "Luigi Verdi"
    }
  ]
}
```

## Leaderboard Endpoints

### Get Leaderboard
Public endpoint showing top users by points. All authenticated users (developers, moderators, admins) can earn points and appear in the leaderboard.

```bash
GET /api/users/leaderboard?limit=50
```

**Query Parameters:**
- `limit` (optional, default: 10): Number of top users to return

**Authentication:** Not required (public endpoint)

**Response:**
```json
{
  "leaderboard": [
    {
      "position": 1,
      "id": 42,
      "name": "Mario",
      "surname": "Rossi",
      "email": "mario.rossi@example.com",
      "role": "developer",
      "rank": 145,
      "registration_date": "2025-10-01T08:00:00.000Z"
    },
    {
      "position": 2,
      "id": 38,
      "name": "Laura",
      "surname": "Bianchi",
      "email": "laura.bianchi@example.com",
      "role": "moderator",
      "rank": 132,
      "registration_date": "2025-09-15T10:20:00.000Z"
    }
  ],
  "count": 2
}
```

**Notes:**
- Leaderboard is public (no authentication required)
- All authenticated users can earn points and appear in the leaderboard
- Ordered by `rank DESC` (where rank represents total points/score)
- Position is calculated based on ranking (1st, 2nd, 3rd, etc.)

### Get Developer Statistics
Get detailed statistics for a specific developer.

```bash
GET /api/tickets/developers/:developerId/stats
```

**Response:**
```json
{
  "stats": {
    "developer_id": 42,
    "name": "Mario Rossi",
    "email": "mario.rossi@example.com",
    "rank": 3,
    "total_points": 98,
    "tickets_resolved": 8,
    "average_rating": 4.50,
    "last_updated": "2025-11-07T10:30:00.000Z",
    "created_at": "2025-10-01T08:00:00.000Z"
  }
}
```

**Notes:**
- Public endpoint (no authentication required)
- Returns 404 if developer has no resolved tickets yet

## Ticket Rating Endpoints

### Rate a Ticket
Allows the ticket requester to rate a resolved ticket.

```bash
POST /api/tickets/:ticketId/rating
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent solution, fixed the issue completely!"
}
```

**Required Fields:**
- `rating` (integer): Rating from 1 (poor) to 5 (excellent)
- `comment` (string, optional): Additional feedback

**Requirements:**
- User must be authenticated
- User should be the ticket requester
- Ticket must be solved

**Response:**
```json
{
  "message": "Rating submitted successfully",
  "rating": {
    "id": 12,
    "ticket_id": 5,
    "rating": 5,
    "comment": "Excellent solution, fixed the issue completely!",
    "rated_by": 3,
    "rated_at": "2025-11-07T16:00:00.000Z"
  }
}
```

### Get Ticket Rating
Retrieve the rating for a specific ticket.

```bash
GET /api/tickets/:ticketId/rating
```

**Authentication:** Not required

**Response:**
```json
{
  "rating": {
    "id": 12,
    "ticket_id": 5,
    "rating": 5,
    "comment": "Excellent solution, fixed the issue completely!",
    "rated_by": 3,
    "rated_at": "2025-11-07T16:00:00.000Z"
  }
}
```

**Notes:**
- Returns 404 if ticket has not been rated
- Rating affects bonus points awarded to the resolver

## Ticket States

### flag_status (Ticket Open/Closed)
- `open`: Ticket is open
- `closed`: Ticket is closed

### solve_status (Resolution Status)
- `not_solved`: Not resolved yet
- `pending_approval`: Developer submitted resolution, awaiting approval
- `solved`: Resolved and approved by moderator/admin

### Valid State Combinations

| flag_status | solve_status | Description |
|------------|--------------|-------------|
| `open` | `not_solved` | Open ticket, not yet resolved |
| `open` | `pending_approval` | Open ticket, resolution pending approval |
| `open` | `solved` | Open ticket, approved resolution (rare) |
| `closed` | `not_solved` | Closed without solution (duplicate, invalid) |
| `closed` | `solved` | Closed with approved solution (ideal case) |
| `closed` | `pending_approval` | Closed but resolution not yet approved (rare) |

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
