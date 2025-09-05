#!/bin/bash
set -e

# filepath: /var/home/antonino/Documents/github/fix-this-stuff-proj/init-scripts/generate-admin-password.sh

# This script generates the SQL to create a default admin user with
# a pre-hashed password and outputs SQL to stdout. Accepts a target DB parameter.

TARGET_DB=$1
ADMIN_EMAIL_PARAM="${ADMIN_EMAIL:-admin@example.com}" # Use env var or default
# Pre-hashed password for 'admin123': $2b$10$xCGK3EtU7zKpa76KZR.pC.hU.3KQN8yqSz9.7QIoL1RZHDtYP9YSe
# The variable itself contains the single quotes needed for the SQL string literal.
ADMIN_PASSWORD_HASHED_FOR_AUTH='$2b$10$qgolECo3lDkyyQsJqqbbpuKCKwPZmuvwTzJMnrAlGA5axiyCbVxYa'

# Placeholder for credentials_id. In a real scenario, this would need to be coordinated.
# For now, using 1, assuming the admin credential in authdb might get ID 1.
# This is a simplification to get the script to pass parsing for userdb.
ADMIN_CREDENTIALS_ID=1 

if [ "$TARGET_DB" == "auth" ]; then
  # Ensure the hashed password, which includes special characters, is treated as a literal string in SQL.
  echo "INSERT INTO credentials (username, password, role)
        SELECT '${ADMIN_EMAIL_PARAM}', '${ADMIN_PASSWORD_HASHED_FOR_AUTH}', 'admin'
        WHERE NOT EXISTS (
            SELECT 1 FROM credentials WHERE username = '${ADMIN_EMAIL_PARAM}'
        );"
elif [ "$TARGET_DB" == "user" ]; then
  # Align with 02-user-schema.sql: name, surname, email, role, credentials_id, rank
  # 'rank' is an integer in user-schema, 'role' is a string. Using 'role' as per schema.
  echo "INSERT INTO users (name, surname, email, role, credentials_id, rank)
        SELECT 'Admin', 'User', '${ADMIN_EMAIL_PARAM}', 'admin', ${ADMIN_CREDENTIALS_ID}, 0 
        WHERE NOT EXISTS (
            SELECT 1 FROM users WHERE email = '${ADMIN_EMAIL_PARAM}'
        );"
else
  echo "Error: Invalid target specified for generate-admin-password.sh. Use 'auth' or 'user'." >&2
  exit 1
fi
