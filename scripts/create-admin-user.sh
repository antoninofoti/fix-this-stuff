#!/bin/bash
# filepath: /var/home/antonino/Documents/github/fix-this-stuff-proj/scripts/create-admin-user.sh

# This script creates an admin user manually by connecting to the database

# Default values
ADMIN_EMAIL=${1:-admin@fixthisstuff.com}
ADMIN_PASSWORD=${2:-admin123}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-userdb}

# Prompt for database password
echo -n "Enter database password for user $DB_USER: "
read -s DB_PASSWORD
echo

# Hash the admin password using Node.js and bcrypt
echo "Hashing password..."
HASHED_PASSWORD=$(node -e "
const bcrypt = require('bcrypt');
const saltRounds = 10;
const password = process.argv[1];

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(hash);
});
" "$ADMIN_PASSWORD")

echo "Creating admin user with email: $ADMIN_EMAIL"

# Create the SQL to insert admin user and execute it
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
-- Create a default admin credential if it doesn't exist
INSERT INTO credentials (username, password)
SELECT 'admin', '$HASHED_PASSWORD'
WHERE NOT EXISTS (
    SELECT 1 FROM credentials WHERE username = 'admin'
);

-- Add admin user to users table if it doesn't exist
INSERT INTO users (name, surname, email, credentials_id, role, rank)
SELECT 
    'System', 'Administrator', '$ADMIN_EMAIL', 
    (SELECT id FROM credentials WHERE username = 'admin'),
    'admin', 100
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = '$ADMIN_EMAIL'
);

-- Print the result
SELECT u.id, u.name, u.surname, u.email, u.role
FROM users u
WHERE u.email = '$ADMIN_EMAIL';
EOF

echo "Admin user creation process completed."
echo "You can now login with:"
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
