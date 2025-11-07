#!/bin/bash

# Script to apply the credentials_id unique constraint migration
# This script can be run manually or automatically

echo "=== Applying credentials_id UNIQUE constraint migration ==="

# Get database connection info from environment or use defaults
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-fix_this_stuff}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-password}"

# Path to the migration script
MIGRATION_SCRIPT="./init-scripts/08-add-credentials-unique-constraint.sql"

if [ ! -f "$MIGRATION_SCRIPT" ]; then
    echo "Error: Migration script not found at $MIGRATION_SCRIPT"
    exit 1
fi

echo "Connecting to database: $DB_NAME@$DB_HOST:$DB_PORT as $DB_USER"

# Execute the migration using psql
PGPASSWORD=$DB_PASSWORD psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$MIGRATION_SCRIPT"

if [ $? -eq 0 ]; then
    echo "✓ Migration applied successfully"
else
    echo "✗ Migration failed"
    exit 1
fi

echo "=== Migration complete ==="
