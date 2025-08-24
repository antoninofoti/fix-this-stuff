#!/bin/bash
# This script updates existing databases to reflect the code cleanup changes
# It should be run after updating the codebase to the new version

echo "Updating databases to match code cleanup changes..."

# Update user-service database
echo "Updating user-service database..."
psql -U postgres -d userdb << EOF
-- Migrate data from user_type to role if needed
UPDATE users SET role = 'developer' WHERE role = 'user';

-- Check if user_type column exists and remove it
DO \$\$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE users DROP COLUMN user_type;
    RAISE NOTICE 'Removed redundant user_type column';
  END IF;
END \$\$;

-- Verify all users have a valid role
SELECT count(*) as users_without_valid_role FROM users 
WHERE role NOT IN ('developer', 'moderator', 'admin');
EOF

# Update ticket-service database with indexes if they don't exist
echo -e "\nUpdating ticket-service database..."
psql -U postgres -d ticketdb << EOF
-- Add missing indexes for improved performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_ticket_update_date ON ticket(update_date);
CREATE INDEX IF NOT EXISTS idx_ticket_assigned_date ON ticket(assigned_date);
CREATE INDEX IF NOT EXISTS idx_ticket_closed_date ON ticket(closed_date);

-- Recreate the updated admin view
DROP VIEW IF EXISTS ticket_admin_view;
CREATE OR REPLACE VIEW ticket_admin_view AS
SELECT 
    t.*,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - t.opening_date)) as days_open,
    CASE 
        WHEN t.deadline_date < CURRENT_TIMESTAMP AND t.flag_status = 'open' THEN TRUE
        ELSE FALSE
    END as is_overdue,
    u1.name as updated_by_name, u1.surname as updated_by_surname,
    u2.name as assigned_by_name, u2.surname as assigned_by_surname,
    u3.name as closed_by_name, u3.surname as closed_by_surname
FROM ticket t
LEFT JOIN users u1 ON t.updated_by = u1.id
LEFT JOIN users u2 ON t.assigned_by = u2.id
LEFT JOIN users u3 ON t.closed_by = u3.id;

-- Count tickets with tracking data
SELECT 
    count(*) as total_tickets,
    count(updated_by) as tickets_with_update_tracking,
    count(assigned_by) as tickets_with_assignment_tracking,
    count(closed_by) as tickets_with_closure_tracking
FROM ticket;
EOF

echo -e "\nDatabase updates completed."
echo "Please restart any running services to apply these changes."
