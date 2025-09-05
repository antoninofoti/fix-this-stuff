-- CREDENTIALS Table to manage access credentials
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'developer'
);

-- fix_this_stuff_system table (a global system config shared here for simplicity)
CREATE TABLE fix_this_stuff_system (
    id SERIAL PRIMARY KEY
);