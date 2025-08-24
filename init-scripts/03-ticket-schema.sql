-- TOPIC Table (topics of the tickets)
CREATE TABLE topic (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- TICKET Table (tickets of the system)
CREATE TABLE ticket (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    opening_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline_date TIMESTAMP NOT NULL,
    flag_status VARCHAR(20) CHECK (flag_status IN ('open', 'closed')),
    solve_status VARCHAR(20) CHECK (solve_status IN ('solved', 'not_solved')),
    request TEXT NOT NULL,
    answer TEXT,
    request_author_id INTEGER NOT NULL,      -- riferimento a user service
    assigned_developer_id INTEGER,           -- riferimento a user service
    system_id INTEGER NOT NULL               -- riferimento a system service
    -- Nessuna FOREIGN KEY verso altri servizi!
);

-- TICKET_TOPIC Table (many-to-many relationship between tickets and topics)
CREATE TABLE ticket_topic (
    ticket_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    PRIMARY KEY (ticket_id, topic_id)
);

-- COMMENT Table (comments on the tickets)
CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    comment_text TEXT NOT NULL,
    author_id INTEGER NOT NULL,              -- riferimento a user service
    ticket_id INTEGER NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Nessuna FOREIGN KEY verso users!
);

-- Indexes
CREATE INDEX idx_ticket_author ON ticket(request_author_id);
CREATE INDEX idx_ticket_developer ON ticket(assigned_developer_id);
CREATE INDEX idx_ticket_status ON ticket(flag_status, solve_status);
CREATE INDEX idx_comment_ticket ON comment(ticket_id);

-- Note: Additional admin-specific indexes are created in ticket-updates.sql
