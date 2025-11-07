-- Migration script to add UNIQUE constraint on credentials_id in users table
-- This prevents duplicate credentials_id which could cause registration errors

-- First, check if there are any duplicate credentials_id values
DO $$
DECLARE
    duplicate_count INTEGER;
    duplicate_record RECORD;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT credentials_id, COUNT(*) as cnt
        FROM users
        GROUP BY credentials_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Warning: Found % duplicate credentials_id values. Please resolve these before adding the constraint.', duplicate_count;
        -- List the duplicates
        RAISE NOTICE 'Duplicate credentials_id values:';
        FOR duplicate_record IN 
            SELECT credentials_id, COUNT(*) as cnt
            FROM users
            GROUP BY credentials_id
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE 'credentials_id: %, count: %', duplicate_record.credentials_id, duplicate_record.cnt;
        END LOOP;
    ELSE
        RAISE NOTICE 'No duplicate credentials_id found. Safe to add UNIQUE constraint.';
    END IF;
END $$;

-- Add the UNIQUE constraint if it doesn't already exist
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_credentials_id_unique'
    ) THEN
        -- Add the constraint
        ALTER TABLE users ADD CONSTRAINT users_credentials_id_unique UNIQUE (credentials_id);
        RAISE NOTICE 'Added UNIQUE constraint on users.credentials_id';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on users.credentials_id already exists';
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Cannot add UNIQUE constraint: duplicate values exist in credentials_id column';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding UNIQUE constraint: %', SQLERRM;
END $$;
