-- Create default admin user during database initialization

-- First, create admin credential in authdb and store its ID
\c authdb;

DO $$
DECLARE
    admin_cred_id INTEGER;
BEGIN
    -- Insert or get existing credential
    INSERT INTO credentials (username, password, role)
    VALUES ('admin@fixthisstuff.com', '$2b$10$frW98NM4KlSVIiSaTOsYP.NA9F77I/P355WyAx8djpigQsN1bnKd.', 'admin')
    ON CONFLICT (username) DO NOTHING;
    
    -- Get the credential ID
    SELECT id INTO admin_cred_id FROM credentials WHERE username = 'admin@fixthisstuff.com';
    
    -- Store it in a temporary table that we can access from userdb
    CREATE TEMP TABLE IF NOT EXISTS temp_admin_id (cred_id INTEGER);
    TRUNCATE temp_admin_id;
    INSERT INTO temp_admin_id VALUES (admin_cred_id);
    
    RAISE NOTICE 'Admin credential ID: %', admin_cred_id;
END $$;

-- Now create admin user in userdb using the fixed ID 1
\c userdb;

INSERT INTO users (name, surname, email, credentials_id, role, rank)
VALUES ('System', 'Administrator', 'admin@fixthisstuff.com', 1, 'admin', 100)
ON CONFLICT (email) DO NOTHING;
