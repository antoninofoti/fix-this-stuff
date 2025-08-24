#!/bin/bash
set -e

# Function to execute SQL against a specific database
execute_sql() {
    local dbname="$1"
    local sql_file="$2"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$dbname" -f "$sql_file"
}

# Function to generate and execute SQL for admin user against a specific database
execute_admin_sql() {
    local dbname="$1"
    local target_for_script="$2" # 'auth' or 'user'
    # Generate the SQL content and execute it via psql, redirecting the script's output to psql's stdin
    /app/scripts/helpers/_generate-admin-password.sh "${target_for_script}" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$dbname"
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

# Generate and insert default admin credentials into authdb
execute_admin_sql "authdb" "auth"

# Generate and insert default admin user profile into userdb
execute_admin_sql "userdb" "user"

# Apply role updates only to userdb (where the users table exists)
execute_sql "userdb" "/docker-entrypoint-initdb.d/05-role-update.sql"

# Apply ticket updates
execute_sql "ticketdb" "/docker-entrypoint-initdb.d/06-ticket-updates.sql"

echo "Multi-database initialization complete."