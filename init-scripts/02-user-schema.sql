-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rank INTEGER DEFAULT 0,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    credentials_id INTEGER NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'developer' CHECK (role IN ('developer', 'moderator', 'admin'))
);

-- User skills table
CREATE TABLE user_skills (
    user_id INTEGER NOT NULL,
    skill VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, skill)
);

