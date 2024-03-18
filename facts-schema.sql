CREATE TABLE users (
    username VARCHAR(25) PRIMARY KEY,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL
        CHECK (position('@' IN email) > 1),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(25) NOT NULL,
    content TEXT NOT NULL,
    time_posted TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    username VARCHAR(25)
        REFERENCES users ON DELETE CASCADE,
    post_id INTEGER
        REFERENCES posts ON DELETE CASCADE,
    PRIMARY KEY (username, post_id)
);

CREATE TABLE follows (
    user_following VARCHAR(25)
        REFERENCES users ON DELETE CASCADE,
    user_followed VARCHAR(25)
        REFERENCES users ON DELETE CASCADE,
    PRIMARY KEY (user_following, user_followed)
);