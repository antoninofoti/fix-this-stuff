-- Credentials table for authentication
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'developer'
);

-- Index to speed up lookups
CREATE INDEX idx_credentials_email ON credentials(username);