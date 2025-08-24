-- This script creates a default admin user during database initialization

-- Create a default admin credential
INSERT INTO credentials (username, password)
SELECT 'admin', '$2b$10$qgolECo3lDkyyQsJqqbbpuKCKwPZmuvwTzJMnrAlGA5axiyCbVxYa' -- Default password: admin123 (hashed with bcrypt)
WHERE NOT EXISTS (
    SELECT 1 FROM credentials WHERE username = 'admin'
);

-- Add admin user to users table (if not already exists)
INSERT INTO users (name, surname, email, credentials_id, role, rank)
SELECT 
    'System', 'Administrator', 'admin@fixthisstuff.com', 
    (SELECT id FROM credentials WHERE username = 'admin'),
    'admin', 100
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@fixthisstuff.com'
);

-- Log creation of admin user for verification
DO $$
BEGIN
    RAISE NOTICE 'Default admin user created or already exists';
END $$;
