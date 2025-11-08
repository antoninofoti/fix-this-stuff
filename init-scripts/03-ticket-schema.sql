-- Topic table (categories for tickets)
CREATE TABLE topic (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Ticket table (main ticket information)
CREATE TABLE ticket (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    opening_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline_date TIMESTAMP NOT NULL,
    flag_status VARCHAR(20) CHECK (flag_status IN ('open', 'closed')),
    solve_status VARCHAR(20) CHECK (solve_status IN ('solved', 'not_solved', 'pending_approval')),
    request TEXT NOT NULL,
    answer TEXT,
    request_author_id INTEGER NOT NULL,
    assigned_developer_id INTEGER,
    system_id INTEGER NOT NULL,
    
    -- Admin/Moderator tracking fields
    updated_by INTEGER,
    update_date TIMESTAMP,
    assigned_date TIMESTAMP,
    closed_by INTEGER,
    closed_date TIMESTAMP,
    
    -- Resolution workflow fields
    resolved_by INTEGER,
    resolved_at TIMESTAMP,
    approved_by INTEGER,
    approval_date TIMESTAMP,
    rejection_reason TEXT
);

-- Ticket-Topic relationship (many-to-many)
CREATE TABLE ticket_topic (
    ticket_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    PRIMARY KEY (ticket_id, topic_id)
);

-- Comments on tickets
CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    comment_text TEXT NOT NULL,
    author_id INTEGER NOT NULL,  -- Reference to user_db (no FK due to different database)
    ticket_id INTEGER NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Developer points leaderboard
CREATE TABLE developer_points (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0 NOT NULL,
    tickets_resolved INTEGER DEFAULT 0 NOT NULL,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket ratings (given by requesters when ticket is resolved)
CREATE TABLE ticket_rating (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL UNIQUE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rated_by INTEGER NOT NULL,
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket indexes
CREATE INDEX idx_ticket_author ON ticket(request_author_id);
CREATE INDEX idx_ticket_developer ON ticket(assigned_developer_id);
CREATE INDEX idx_ticket_status ON ticket(flag_status, solve_status);
CREATE INDEX idx_ticket_updated_by ON ticket(updated_by);
CREATE INDEX idx_ticket_closed_by ON ticket(closed_by);
CREATE INDEX idx_ticket_update_date ON ticket(update_date);
CREATE INDEX idx_ticket_assigned_date ON ticket(assigned_date);
CREATE INDEX idx_ticket_closed_date ON ticket(closed_date);
CREATE INDEX idx_ticket_resolved_by ON ticket(resolved_by);
CREATE INDEX idx_ticket_approved_by ON ticket(approved_by);
CREATE INDEX idx_ticket_solve_status ON ticket(solve_status);

-- Comment indexes
CREATE INDEX idx_comment_ticket ON comment(ticket_id);

-- Developer points indexes
CREATE INDEX idx_developer_points_total ON developer_points(total_points DESC);
CREATE INDEX idx_developer_points_dev_id ON developer_points(developer_id);

-- Ticket rating indexes
CREATE INDEX idx_ticket_rating_ticket ON ticket_rating(ticket_id);
CREATE INDEX idx_ticket_rating_rated_by ON ticket_rating(rated_by);

-- Trigger to automatically update update_date when ticket is modified
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_update_timestamp
    BEFORE UPDATE ON ticket
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp();

-- Table and column documentation
COMMENT ON TABLE topic IS 'Categories/topics that can be assigned to tickets';

COMMENT ON TABLE ticket IS 'Main ticket information including status, assignment, and resolution workflow';
COMMENT ON COLUMN ticket.updated_by IS 'Moderator/Admin who last updated the ticket';
COMMENT ON COLUMN ticket.closed_by IS 'Moderator/Admin who closed the ticket';
COMMENT ON COLUMN ticket.resolved_by IS 'Developer who submitted the resolution (pending approval)';
COMMENT ON COLUMN ticket.resolved_at IS 'Timestamp when developer requested resolution approval';
COMMENT ON COLUMN ticket.approved_by IS 'Moderator or Admin who approved the resolution';
COMMENT ON COLUMN ticket.approval_date IS 'Timestamp when resolution was approved';
COMMENT ON COLUMN ticket.rejection_reason IS 'Reason provided if resolution was rejected';

COMMENT ON TABLE comment IS 'Comments on tickets (no FK to users due to different database)';
COMMENT ON COLUMN comment.author_id IS 'Reference to user_db.users.id';

COMMENT ON TABLE developer_points IS 'Points leaderboard for developers based on resolved tickets';
COMMENT ON COLUMN developer_points.total_points IS 'Total points earned: high=10, medium=5, low=2 + rating bonus';
COMMENT ON COLUMN developer_points.tickets_resolved IS 'Number of tickets successfully resolved and approved';
COMMENT ON COLUMN developer_points.average_rating IS 'Average rating received on resolved tickets';

COMMENT ON TABLE ticket_rating IS 'Ratings given by ticket requesters when their tickets are resolved';
COMMENT ON COLUMN ticket_rating.rating IS 'Rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN ticket_rating.rated_by IS 'User ID who gave the rating (typically the ticket requester)';

