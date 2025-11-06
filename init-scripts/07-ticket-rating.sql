-- This script adds a table to track ticket ratings
-- When a ticket is closed as solved, the requester can rate the resolution

-- TICKET_RATING Table (ratings given to tickets when resolved)
CREATE TABLE IF NOT EXISTS ticket_rating (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL UNIQUE,  -- One rating per ticket
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rated_by INTEGER NOT NULL,  -- User who gave the rating (should be ticket author)
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticket_rating_ticket ON ticket_rating(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_rating_rated_by ON ticket_rating(rated_by);

-- Add a column to track if a ticket has been rated
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS rating_id INTEGER REFERENCES ticket_rating(id);

-- Add index for rating_id
CREATE INDEX IF NOT EXISTS idx_ticket_rating_id ON ticket(rating_id);

-- Comment to explain the purpose of the table
COMMENT ON TABLE ticket_rating IS 'Stores ratings given by ticket requesters when their tickets are resolved';
COMMENT ON COLUMN ticket_rating.rating IS 'Rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN ticket_rating.rated_by IS 'User ID who gave the rating (typically the ticket requester)';
