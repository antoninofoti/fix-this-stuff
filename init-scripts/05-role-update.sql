-- This script updates existing users to have proper roles based on their rank

-- First, update any users with high rank to admin role
UPDATE users
SET role = 'admin'
WHERE rank >= 10;

-- Ensure all users have a valid role
UPDATE users
SET role = 'developer'
WHERE role IS NULL OR role NOT IN ('developer', 'moderator', 'admin');
