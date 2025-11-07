# Ticket Resolution System and Leaderboard

## Overview
This document describes the ticket resolution approval system with point assignment to developers and a public leaderboard. The system ensures quality control by requiring moderator or administrator approval before awarding points for resolved tickets.

## Ticket Resolution Workflow

### Ticket States

#### `flag_status` (Open/Closed State)
- `open`: Ticket is currently open
- `closed`: Ticket has been closed

#### `solve_status` (Resolution State)
- `not_solved`: Ticket has not been resolved
- `pending_approval`: Resolution submitted by developer, awaiting moderator/admin approval
- `solved`: Resolution has been approved and points awarded

### Valid State Combinations

| flag_status | solve_status | Description |
|------------|--------------|-------------|
| `open` | `not_solved` | Ticket is open and unresolved |
| `open` | `pending_approval` | Developer has submitted resolution, awaiting approval |
| `open` | `solved` | Ticket has been approved but not yet closed (rare case) |
| `closed` | `not_solved` | Ticket closed without resolution (duplicate, invalid, etc.) |
| `closed` | `solved` | Ticket resolved, approved, and closed (ideal case) |
| `closed` | `pending_approval` | Ticket closed but resolution not yet approved (rare case) |

## Workflow by Role

### Developer
1. **Assigned to ticket** by administrator or moderator
2. **Works on resolution** and implements fix
3. **Requests approval** via `POST /api/tickets/:id/request-resolution`
   - Updates `solve_status` to `pending_approval`
   - Records `resolved_by` (developer ID)
   - Records `resolved_at` (timestamp)
4. **Awaits decision** from moderator or administrator
5. **If approved**: Automatically receives points
6. **If rejected**: Can resubmit after making necessary modifications

### Moderator
1. **Views pending tickets** via `GET /api/tickets/admin/pending-approval`
2. **Reviews resolution** submitted by developer
3. **Approves resolution** via `POST /api/tickets/:id/approve-resolution`
   - Updates `solve_status` to `solved`
   - Awards points to developer
   - Records `approved_by` and `approval_date`
   - Updates `developer_points` table
4. **Rejects resolution** via `POST /api/tickets/:id/reject-resolution`
   - Reverts `solve_status` to `not_solved`
   - Requires rejection `reason`
   - Developer may resubmit
5. **Can manage tickets** (assign, modify priority, close, etc.)
6. **Cannot modify users** (no access to `/api/roles/users/:userId/role`)

### Administrator
- Has **all moderator permissions**
- **Can modify users**: change roles, create, delete accounts
- Full access to `/api/roles/*` endpoints

## Point System

### Base Point Calculation

| Priority | Base Points |
|----------|-------------|
| `high` | 10 points |
| `medium` | 5 points |
| `low` | 2 points |

### Rating Bonus

When the ticket requester rates the resolution (1-5 stars):
- **Bonus = rating × 2**
- Examples:
  - Rating 5: +10 bonus points
  - Rating 3: +6 bonus points
  - Rating 1: +2 bonus points

### Total Points Formula
```
Total Points = Base Points (priority) + Rating Bonus
```

**Examples:**
- `high` priority ticket + rating 5: 10 + 10 = **20 points**
- `medium` priority ticket + rating 3: 5 + 6 = **11 points**
- `low` priority ticket + rating 5: 2 + 10 = **12 points**

### Point Assignment Rules
- Points awarded **only when moderator/admin approves** the resolution
- If resolution is **rejected**, no points are awarded
- **Only developers** receive points
- **Moderators and administrators do not** participate in the leaderboard

## Developer Points Table

### Schema Structure
```sql
CREATE TABLE developer_points (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER UNIQUE,
    total_points INTEGER DEFAULT 0,
    tickets_resolved INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Field Descriptions
- `developer_id`: Developer's user ID (foreign key reference to users table)
- `total_points`: Cumulative points earned
- `tickets_resolved`: Number of tickets successfully resolved and approved
- `average_rating`: Mean rating received across all resolved tickets (1.00 - 5.00)
- `last_updated`: Timestamp of last point update

## Leaderboard

### Endpoint
- **GET** `/api/tickets/leaderboard/top?limit=50`
- **Public access**: Visible to all users (authentication not required)
- **Displays only developers** (role = 'developer')

### Response Format
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "developer_id": 42,
      "name": "John Smith",
      "total_points": 145,
      "tickets_resolved": 12,
      "average_rating": 4.25,
      "last_updated": "2025-11-07T10:30:00Z"
    }
  ]
}
```

### Sorting Order
1. **total_points** (descending)
2. **tickets_resolved** (descending, used as tie-breaker)

## Individual Developer Statistics

### Endpoint
- **GET** `/api/tickets/developers/:developerId/stats`

### Response Format
```json
{
  "stats": {
    "developer_id": 42,
    "name": "John Smith",
    "email": "john.smith@example.com",
    "rank": 3,
    "total_points": 98,
    "tickets_resolved": 8,
    "average_rating": 4.50,
    "last_updated": "2025-11-07T10:30:00Z",
    "created_at": "2025-10-01T08:00:00Z"
  }
}
```

## Role-Based Dashboard Access

### Moderator Capabilities
**Permitted Actions:**
- View pending approval tickets list
- Approve or reject ticket resolutions
- Assign tickets to developers
- Modify ticket priority and details
- Close tickets
- View ticket statistics

**Restricted Actions:**
- Cannot modify user accounts (no role changes)
- Cannot delete user accounts
- Does not appear in leaderboard

### Administrator Capabilities
**Has all moderator permissions plus:**
- Modify user roles
- Create and delete user accounts
- Manage moderator accounts
- Full system access

**Restrictions:**
- Does not appear in leaderboard

## Primary API Endpoints

### Resolution Workflow
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/tickets/:id/request-resolution` | Developer | Request resolution approval |
| POST | `/api/tickets/:id/approve-resolution` | Moderator/Admin | Approve resolution and award points |
| POST | `/api/tickets/:id/reject-resolution` | Moderator/Admin | Reject resolution with reason |
| GET | `/api/tickets/admin/pending-approval` | Moderator/Admin | List tickets pending approval |

### Leaderboard
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/tickets/leaderboard/top` | Public | Retrieve top developers by points |
| GET | `/api/tickets/developers/:id/stats` | Public | Get specific developer statistics |

### User Management (Admin Only)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| PUT | `/api/roles/users/:userId/role` | **Admin only** | Modify user role |
| GET | `/api/roles/users/:role` | **Admin only** | List users by role |

## Database Schema Extensions

### Ticket Table Additions
```sql
ALTER TABLE ticket ADD COLUMN
  resolved_by INTEGER,           -- Developer who resolved the ticket
  resolved_at TIMESTAMP,         -- When approval was requested
  approved_by INTEGER,           -- Moderator/Admin who approved
  approval_date TIMESTAMP,       -- Date of approval
  rejection_reason TEXT;         -- Rejection reason (if applicable)
```

## Common Usage Scenarios

### Scenario 1: Developer Resolution with Approval
1. Developer submits: `POST /tickets/123/request-resolution`
2. Status changes to `pending_approval`
3. Moderator approves: `POST /tickets/123/approve-resolution`
4. Status changes to `solved`
5. Developer automatically receives points

### Scenario 2: Developer Resolution Rejected
1. Developer submits: `POST /tickets/123/request-resolution`
2. Status changes to `pending_approval`
3. Moderator rejects: `POST /tickets/123/reject-resolution` with reason
4. Status reverts to `not_solved`
5. Developer may resubmit after addressing feedback

### Scenario 3: Administrator Closes Without Resolution
1. Administrator determines ticket is unresolvable or duplicate
2. Administrator closes ticket: `flag_status: closed`, `solve_status: not_solved`
3. No points awarded

### Scenario 4: Rating After Approval
1. Developer resolves ticket and receives approval with base points
2. Ticket requester submits rating (1-5 stars)
3. System recalculates developer's `average_rating`
4. Rating bonus already included in total points awarded

## Implementation Notes

### Transaction Management
Resolution approval uses database transactions to ensure atomicity of:
- Ticket status update
- Developer points insertion/update
- Average rating recalculation
- Operation consistency

### Performance Optimizations
- Index on `solve_status` for fast pending approval queries
- Index on `total_points DESC` for efficient leaderboard retrieval
- Leaderboard caching recommended for future implementation

### Security Considerations
- Developers can only request approval for tickets assigned to them
- Moderator and administrator roles verified via middleware
- Leaderboard is public but read-only
