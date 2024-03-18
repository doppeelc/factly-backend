INSERT INTO users (username, password, display_name, email, is_admin)
VALUES ('testuser',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Test User',
        'joel@joelburton.com',
        FALSE),
       ('testadmin',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Test Admin!',
        'joel@joelburton.com',
        TRUE);

INSERT INTO posts (username, content)
VALUES ('testuser', 'heres a random fact'),
       ('testuser', 'heres another random fact'),
       ('testadmin', 'I am better than testuser'),
       ('testadmin', 'Imagine not having admin');