-- This script adds new columns to the ticket table to support admin/moderator operations

-- Add updated_by column to track which moderator/admin last updated the ticket
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS updated_by INTEGER;

-- Add update_date column to track when the ticket was last updated
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS update_date TIMESTAMP;

-- Add assigned_by column to track which moderator/admin assigned the ticket
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS assigned_by INTEGER;

-- Add assigned_date column to track when the ticket was assigned
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP;

-- Add closed_by column to track which moderator/admin closed the ticket
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS closed_by INTEGER;

-- Add closed_date column to track when the ticket was closed
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP;

-- Add additional index for updated_by
CREATE INDEX IF NOT EXISTS idx_ticket_updated_by ON ticket(updated_by);

-- Add additional index for assigned_by
CREATE INDEX IF NOT EXISTS idx_ticket_assigned_by ON ticket(assigned_by);

-- Add additional index for closed_by
CREATE INDEX IF NOT EXISTS idx_ticket_closed_by ON ticket(closed_by);

-- Add additional indexes for date columns for better query performance
CREATE INDEX IF NOT EXISTS idx_ticket_update_date ON ticket(update_date);
CREATE INDEX IF NOT EXISTS idx_ticket_assigned_date ON ticket(assigned_date);
CREATE INDEX IF NOT EXISTS idx_ticket_closed_date ON ticket(closed_date);

-- Add a view for admin dashboard that includes admin tracking IDs
CREATE OR REPLACE VIEW ticket_admin_view AS
SELECT 
    t.*,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - t.opening_date)) as days_open,
    CASE 
        WHEN t.deadline_date < CURRENT_TIMESTAMP AND t.flag_status = 'open' THEN TRUE
        ELSE FALSE
    END as is_overdue
    -- Removed direct joins to users table to avoid cross-database query issues.
    -- User details (name, surname) can be fetched by the application using the IDs:
    -- t.updated_by, t.assigned_by, t.closed_by
FROM ticket t;
