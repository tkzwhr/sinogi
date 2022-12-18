CREATE TABLE books
(
    book_id    INTEGER NOT NULL
        PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (DATETIME('now', 'localtime'))
);

CREATE UNIQUE INDEX unq_books_name
    ON books (name);

CREATE TABLE problems
(
    problem_id  INTEGER NOT NULL
        PRIMARY KEY AUTOINCREMENT,
    book_id     INTEGER NOT NULL REFERENCES books (book_id),
    title       TEXT    NOT NULL,
    description TEXT,
    sgf         TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (DATETIME('now', 'localtime'))
);

CREATE UNIQUE INDEX unq_problems_book_id_title
    ON problems (book_id, title);

CREATE TABLE game_histories
(
    game_history_id INTEGER NOT NULL
        PRIMARY KEY AUTOINCREMENT,
    problem_id      INTEGER NOT NULL REFERENCES problems (problem_id),
    played_at       TEXT    NOT NULL DEFAULT (DATE('now', 'localtime')),
    is_correct      INTEGER NOT NULL
);

CREATE INDEX idx_game_histories_problem_id
    ON game_histories (problem_id);

CREATE INDEX idx_game_histories_played_at
    ON game_histories (played_at);
