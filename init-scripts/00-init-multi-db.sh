#!/bin/bash
set -e

# Function to execute SQL against a specific database
execute_sql() {
    local dbname="$1"
    local sql_file="$2"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$dbname" -f "$sql_file"
}

# Create databases if they don't exist
DATABASES=("authdb" "userdb" "ticketdb")
for dbname in "${DATABASES[@]}"; do
    # Check if the database exists
    if psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tc "SELECT 1 FROM pg_database WHERE datname = '$dbname'" | grep -q 1; then
        echo "Database $dbname already exists."
    else
        echo "Creating database $dbname..."
        psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE $dbname"
    fi
done

# Setup schemas and initial data
execute_sql "authdb" "/docker-entrypoint-initdb.d/01-auth-schema.sql"
execute_sql "userdb" "/docker-entrypoint-initdb.d/02-user-schema.sql"
execute_sql "ticketdb" "/docker-entrypoint-initdb.d/03-ticket-schema.sql"

# Create default admin user (needs to run without specific database context to switch between them)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -f "/docker-entrypoint-initdb.d/04-default-admin.sql"

echo "Multi-database initialization complete."