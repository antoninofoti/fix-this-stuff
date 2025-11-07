-- Migration: Add resolution workflow and points system
-- This adds support for:
-- 1. Developer requesting resolution approval
-- 2. Moderator/Admin approving or rejecting resolutions
-- 3. Points system for developers

-- Add new columns to ticket table
ALTER TABLE ticket 
    ADD COLUMN IF NOT EXISTS resolved_by INTEGER,  -- Developer who resolved the ticket
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,  -- When the resolution was submitted
    ADD COLUMN IF NOT EXISTS approved_by INTEGER,  -- Moderator/Admin who approved
    ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP,  -- When it was approved
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;  -- If rejected, why

-- Update solve_status to include pending_approval
-- Note: We can't alter the CHECK constraint directly, so we need to drop and recreate
ALTER TABLE ticket DROP CONSTRAINT IF EXISTS ticket_solve_status_check;
ALTER TABLE ticket ADD CONSTRAINT ticket_solve_status_check 
    CHECK (solve_status IN ('solved', 'not_solved', 'pending_approval'));

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_ticket_resolved_by ON ticket(resolved_by);
CREATE INDEX IF NOT EXISTS idx_ticket_approved_by ON ticket(approved_by);
CREATE INDEX IF NOT EXISTS idx_ticket_solve_status ON ticket(solve_status);

-- Create developer_points table
CREATE TABLE IF NOT EXISTS developer_points (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER NOT NULL UNIQUE,  -- Reference to user (must be developer)
    total_points INTEGER DEFAULT 0 NOT NULL,
    tickets_resolved INTEGER DEFAULT 0 NOT NULL,
    average_rating DECIMAL(3,2) DEFAULT 0.00,  -- Average rating from 1.00 to 5.00
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for leaderboard queries (order by total_points DESC)
CREATE INDEX IF NOT EXISTS idx_developer_points_total ON developer_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_developer_points_dev_id ON developer_points(developer_id);

-- Add comments for documentation
COMMENT ON COLUMN ticket.resolved_by IS 'Developer who submitted the resolution (pending approval)';
COMMENT ON COLUMN ticket.resolved_at IS 'Timestamp when developer requested resolution approval';
COMMENT ON COLUMN ticket.approved_by IS 'Moderator or Admin who approved the resolution';
COMMENT ON COLUMN ticket.approval_date IS 'Timestamp when resolution was approved';
COMMENT ON COLUMN ticket.rejection_reason IS 'Reason provided if resolution was rejected';

COMMENT ON TABLE developer_points IS 'Points leaderboard for developers based on resolved tickets';
COMMENT ON COLUMN developer_points.total_points IS 'Total points earned: high=10, medium=5, low=2 + rating bonus';
COMMENT ON COLUMN developer_points.tickets_resolved IS 'Number of tickets successfully resolved and approved';
COMMENT ON COLUMN developer_points.average_rating IS 'Average rating received on resolved tickets';
