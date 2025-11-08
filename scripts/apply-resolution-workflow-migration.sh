#!/bin/bash

# Script to apply ticket resolution workflow migration
# This adds support for developer resolution approval and points system

set -e

echo "================================"
echo "Ticket Resolution Workflow Migration"
echo "================================"
echo ""

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="ticketdb"
DB_USER="${DB_USER:-ticket_user}"

echo "Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Apply the migration
echo "Applying migration: 10-ticket-resolution-workflow.sql"
echo ""

PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -f "../init-scripts/10-ticket-resolution-workflow.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "New features available:"
    echo "  - Developer can request resolution approval"
    echo "  - Moderator/Admin can approve/reject resolutions"
    echo "  - Points system for developers"
    echo "  - Leaderboard tracking"
    echo ""
    echo "Database changes:"
    echo "  - Added columns: resolved_by, resolved_at, approved_by, approval_date, rejection_reason"
    echo "  - Updated solve_status constraint to include 'pending_approval'"
    echo "  - Created developer_points table"
    echo "  - Added indexes for performance"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above."
    exit 1
fi

# Verify the changes
echo "Verifying changes..."
echo ""

# Check if new columns exist
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'ticket' AND column_name IN ('resolved_by', 'resolved_at', 'approved_by', 'approval_date', 'rejection_reason');" \
    -t

# Check if developer_points table exists
TABLE_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'developer_points');" | xargs)

if [ "$TABLE_EXISTS" = "t" ]; then
    echo "✅ developer_points table created successfully"
else
    echo "❌ developer_points table not found"
fi

echo ""
echo "================================"
echo "Migration Complete!"
echo "================================"
