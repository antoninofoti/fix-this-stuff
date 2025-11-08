# Ticket Resolution System and Leaderboard

## Overview
This document describes the ticket resolution approval system with point assignment to all authenticated users and a public leaderboard. The system ensures quality control through a peer-review approval process, preventing self-approval while allowing all users to contribute and earn points.

## Ticket Resolution Workflow

### Ticket States

#### `flag_status` (Open/Closed State)
- `open`: Ticket is currently open
- `closed`: Ticket has been closed

#### `solve_status` (Resolution State)
- `not_solved`: Ticket has not been resolved
- `pending_approval`: Resolution submitted, awaiting approval from another moderator or administrator
- `solved`: Resolution has been approved and points awarded

### Valid State Combinations

| flag_status | solve_status | Description |
|------------|--------------|-------------|
| `open` | `not_solved` | Ticket is open and unresolved |
| `open` | `pending_approval` | User has submitted resolution, awaiting approval |
| `open` | `solved` | Ticket has been approved but not yet closed |
| `closed` | `not_solved` | Ticket closed without resolution (duplicate, invalid, etc.) |
| `closed` | `solved` | Ticket resolved, approved, and closed (ideal case) |
| `closed` | `pending_approval` | Ticket closed but resolution not yet approved |

## Workflow for All Users

All authenticated users (Developers, Moderators, and Administrators) can participate in ticket resolution and earn points.

### Ticket Assignment and Resolution Process

1. **Self-Assignment**: Any authenticated user can assign themselves to an open, unassigned ticket
2. **Work on Resolution**: User implements the fix or provides a solution
3. **Request Approval**: User submits resolution via `POST /api/tickets/:id/request-resolution`
   - Updates `solve_status` to `pending_approval`
   - Records `resolved_by` (user ID)
   - Records `resolved_at` (timestamp)
4. **Peer Review**: Another moderator or administrator reviews the resolution
5. **Approval Decision**:
   - **If approved**: User automatically receives points based on priority and rating
   - **If rejected**: User can resubmit after making necessary modifications

### Anti-Self-Approval Rule

A critical constraint ensures fairness and quality control:
- **Users cannot approve tickets they resolved themselves**
- The `resolved_by` user ID must be different from the `approved_by` user ID
- This prevents conflicts of interest and maintains integrity of the point system
- Requires peer review for all resolutions

### Role-Specific Capabilities

#### Developer
- Can assign tickets to themselves
- Can request resolution approval
- Can create new tickets
- Participates in leaderboard

#### Moderator
- Has all developer capabilities
- Can approve resolutions submitted by others
- Can reject resolutions with feedback
- Can view pending approval queue
- Can manage tickets (assign, modify priority, close)
- Cannot modify user accounts or roles
- Participates in leaderboard

#### Administrator
- Has all moderator capabilities
- Can modify user roles and accounts
- Full system access
- Participates in leaderboard

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
- `high` priority ticket + rating 5: 10 + 10 = 20 points
- `medium` priority ticket + rating 3: 5 + 6 = 11 points
- `low` priority ticket + rating 5: 2 + 10 = 12 points

### Point Assignment Rules
- Points awarded when a moderator or administrator approves the resolution
- If resolution is rejected, no points are awarded
- All users (developers, moderators, administrators) receive points for approved resolutions
- Points are tied to the user, not their role
- Role changes do not affect accumulated points

### Role Changes and Point Persistence

Points are permanently associated with the user account:
- **Developer promoted to Moderator**: Retains all previously earned points
- **Moderator demoted to Developer**: Retains all previously earned points
- **Administrator changes**: Points remain unchanged
- The leaderboard always reflects a user's total contribution regardless of current role

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
- `developer_id`: User's ID (foreign key reference to users table)
- `total_points`: Cumulative points earned
- `tickets_resolved`: Number of tickets successfully resolved and approved
- `average_rating`: Mean rating received across all resolved tickets (1.00 - 5.00)
- `last_updated`: Timestamp of last point update

## Leaderboard

### Endpoint
- **GET** `/api/tickets/leaderboard/top?limit=50`
- **Public access**: Visible to all users (authentication not required)
- **Displays all users** who have earned points, regardless of role

### Response Format
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "developer_id": 42,
      "name": "John Smith",
      "role": "developer",
      "total_points": 145,
      "tickets_resolved": 12,
      "average_rating": 4.25,
      "last_updated": "2025-11-07T10:30:00Z"
    },
    {
      "rank": 2,
      "developer_id": 15,
      "name": "Sarah Admin",
      "role": "admin",
      "total_points": 120,
      "tickets_resolved": 8,
      "average_rating": 4.75,
      "last_updated": "2025-11-06T14:20:00Z"
    }
  ]
}
```

### Sorting Order
1. **total_points** (descending)
2. **tickets_resolved** (descending, used as tie-breaker)

### UI Display
- Role badges displayed for each user:
  - **Admin**: Red badge
  - **Moderator**: Orange badge
  - **Developer**: Blue badge
- All users compete on the same leaderboard regardless of role

## Individual User Statistics

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

### Developer Capabilities
**Permitted Actions:**
- Self-assign tickets
- Submit ticket resolutions for approval
- View assigned tickets
- Create new tickets
- Participate in leaderboard

**Restricted Actions:**
- Cannot approve resolutions (requires moderator or admin)
- Cannot modify other users' tickets
- Cannot change user roles

### Moderator Capabilities
**Has all developer permissions plus:**
- View pending approval tickets list
- Approve or reject ticket resolutions submitted by other users
- Assign tickets to any user
- Modify ticket priority and details
- Close tickets
- View ticket statistics
- Participate in leaderboard

**Restricted Actions:**
- Cannot modify user accounts (no role changes)
- Cannot delete user accounts
- Cannot approve their own ticket resolutions

### Administrator Capabilities
**Has all moderator permissions plus:**
- Modify user roles
- Create and delete user accounts
- Manage moderator accounts
- Full system access
- Participate in leaderboard

**Restrictions:**
- Cannot approve their own ticket resolutions (anti-self-approval rule applies)

## Primary API Endpoints

### Resolution Workflow
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/tickets/:id/request-resolution` | All authenticated | Request resolution approval |
| POST | `/api/tickets/:id/approve-resolution` | Moderator/Admin | Approve resolution and award points (cannot approve own) |
| POST | `/api/tickets/:id/reject-resolution` | Moderator/Admin | Reject resolution with reason |
| GET | `/api/tickets/admin/pending-approval` | Moderator/Admin | List tickets pending approval |

### Leaderboard
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/tickets/leaderboard/top` | Public | Retrieve top users by points (all roles) |
| GET | `/api/tickets/developers/:id/stats` | Public | Get specific user statistics |

### User Management (Admin Only)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| PUT | `/api/roles/users/:userId/role` | **Admin only** | Modify user role |
| GET | `/api/roles/users/:role` | **Admin only** | List users by role |

## Database Schema Extensions

### Ticket Table Additions
```sql
ALTER TABLE ticket ADD COLUMN
  resolved_by INTEGER,           -- User who resolved the ticket
  resolved_at TIMESTAMP,         -- When approval was requested
  approved_by INTEGER,           -- Moderator/Admin who approved
  approval_date TIMESTAMP,       -- Date of approval
  rejection_reason TEXT;         -- Rejection reason (if applicable)
```

## Common Usage Scenarios

### Scenario 1: User Resolution with Approval
1. User (any role) submits: `POST /tickets/123/request-resolution`
2. Status changes to `pending_approval`
3. Another moderator or admin approves: `POST /tickets/123/approve-resolution`
4. Status changes to `solved`
5. User automatically receives points
6. Points synchronized with user-service leaderboard

### Scenario 2: Resolution Rejected
1. User submits: `POST /tickets/123/request-resolution`
2. Status changes to `pending_approval`
3. Moderator or admin rejects: `POST /tickets/123/reject-resolution` with reason
4. Status reverts to `not_solved`
5. User may resubmit after addressing feedback

### Scenario 3: Self-Approval Prevention
1. User resolves ticket (user ID: 42)
2. Same user attempts to approve their own resolution
3. System blocks approval with error: "Cannot approve your own ticket resolution"
4. Requires another moderator or administrator to perform approval

### Scenario 4: Administrator Closes Without Resolution
1. Administrator determines ticket is unresolvable or duplicate
2. Administrator closes ticket: `flag_status: closed`, `solve_status: not_solved`
3. No points awarded

### Scenario 5: Rating After Approval
1. User resolves ticket and receives approval with base points
2. Ticket requester submits rating (1-5 stars)
3. System recalculates user's `average_rating`
4. Rating bonus already included in total points awarded

### Scenario 6: Role Change Maintains Points
1. Developer earns 50 points from resolving 5 tickets
2. Developer promoted to moderator
3. User continues resolving tickets as moderator
4. Earns additional 30 points as moderator
5. Leaderboard shows total: 80 points with "Moderator" badge
6. All points remain with the user account regardless of role changes

## Implementation Notes

### Transaction Management
Resolution approval uses database transactions to ensure atomicity of:
- Ticket status update
- User points insertion/update in ticket-service
- Point synchronization with user-service rank field
- Average rating recalculation
- Operation consistency

### Anti-Self-Approval Enforcement
- Model-level check: `ticketModel.approveResolution()` validates `resolved_by !== approved_by`
- Controller-level validation for additional security
- Ensures peer review for all resolutions

### Point Synchronization
- Points stored in both ticket-service (`developer_points` table) and user-service (`rank` field)
- ServiceRegistry ensures cross-service consistency
- User-service updates happen synchronously during approval

### Performance Optimizations
- Index on `solve_status` for fast pending approval queries
- Index on `total_points DESC` for efficient leaderboard retrieval
- Leaderboard caching recommended for future implementation

### Security Considerations
- Users can only request approval for tickets assigned to them
- Moderator and administrator roles verified via middleware
- Anti-self-approval rule enforced at database and application layers
- Leaderboard is public but read-only
