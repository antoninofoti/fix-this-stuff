-- Table creation for the Ticket Service microservice

-- CREDENTIALS Table to manage access credentials
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FIX_THIS_STUFF_SYSTEM Table (controller for the system)
-- This table is used to manage the system and its settings
-- It can be used to store system-wide settings or configurations
CREATE TABLE fix_this_stuff_system (
    id SERIAL PRIMARY KEY
);

-- MODERATOR Table (moderators of the system)
CREATE TABLE moderator (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    credentials_id INTEGER NOT NULL,
    FOREIGN KEY (credentials_id) REFERENCES credentials(id) ON DELETE CASCADE
);

-- USERS Table (developers of the system)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rank INTEGER DEFAULT 0,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    credentials_id INTEGER NOT NULL,
    FOREIGN KEY (credentials_id) REFERENCES credentials(id) ON DELETE CASCADE
);

-- USER_SKILLS Table (skills of the developers)
CREATE TABLE user_skills (
    user_id INTEGER NOT NULL,
    skill VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, skill),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
    request_author_id INTEGER NOT NULL,
    assigned_developer_id INTEGER,
    system_id INTEGER NOT NULL,
    FOREIGN KEY (request_author_id) REFERENCES users(id),
    FOREIGN KEY (assigned_developer_id) REFERENCES users(id),
    FOREIGN KEY (system_id) REFERENCES fix_this_stuff_system(id)
);

-- TICKET_TOPIC Table (many-to-many relationship between tickets and topics)
CREATE TABLE ticket_topic (
    ticket_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    PRIMARY KEY (ticket_id, topic_id),
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topic(id) ON DELETE CASCADE
);

-- COMMENT Table (comments on the tickets)
CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    comment_text TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    ticket_id INTEGER NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE
);

-- Adding indexes to improve query performance
CREATE INDEX idx_ticket_author ON ticket(request_author_id);
CREATE INDEX idx_ticket_developer ON ticket(assigned_developer_id);
CREATE INDEX idx_ticket_status ON ticket(flag_status, solve_status);
CREATE INDEX idx_comment_ticket ON comment(ticket_id);
CREATE INDEX idx_user_skills ON user_skills(skill);

-- Trigger function to update the rank of a developer when a ticket is solved
CREATE OR REPLACE FUNCTION update_developer_rank()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.solve_status = 'solved' AND OLD.solve_status = 'not_solved' THEN
        UPDATE users SET rank = rank + 1 WHERE id = NEW.assigned_developer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function when a ticket is solved
CREATE TRIGGER ticket_solved
AFTER UPDATE ON ticket
FOR EACH ROW
WHEN (NEW.solve_status = 'solved' AND OLD.solve_status = 'not_solved')
EXECUTE FUNCTION update_developer_rank();