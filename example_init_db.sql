-- Inserimento dati di esempio nel sistema
INSERT INTO fix_this_stuff_system VALUES (DEFAULT);

-- Inserimento credenziali
INSERT INTO credentials (username, password) VALUES
('dev1', 'password_hash'),
('user1', 'password_hash'),
('mod1', 'password_hash');

-- Inserimento utenti
INSERT INTO users (name, surname, email, credentials_id) VALUES
('Mario', 'Rossi', 'mario@example.com', 1),
('Lucia', 'Bianchi', 'lucia@example.com', 2);

-- Inserimento moderatore
INSERT INTO moderator (name, surname, email, credentials_id) VALUES
('Admin', 'Super', 'admin@example.com', 3);

-- Inserimento topic
INSERT INTO topic (name) VALUES
('Python'),
('Database'),
('Frontend');

-- Inserimento ticket
INSERT INTO ticket (title, priority, deadline_date, flag_status, solve_status, request, request_author_id, assigned_developer_id, system_id) VALUES
('Problema con query SQL', 'high', CURRENT_TIMESTAMP + INTERVAL '3 days', 'open', 'not_solved', 'Ho un problema con una query JOIN', 2, 1, 1);

-- Collegamento ticket-topic
INSERT INTO ticket_topic VALUES (1, 2);

-- Inserimento commento
INSERT INTO comment (comment_text, author_id, ticket_id) VALUES
('Puoi fornire più dettagli?', 1, 1);