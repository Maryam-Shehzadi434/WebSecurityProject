-- seed-data.sql  (Education Portal)
-- This file defines the database tables and fills them with starting data.
-- It is run once by db-setup.js to create database.db.

-- Table of all users of the portal
CREATE TABLE users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT,
  password  TEXT,     -- stored in plain text ON PURPOSE (vulnerable version)
  role      TEXT,     -- 'admin' or 'student'
  email     TEXT
);

-- Table of comments shown on the public comments page
CREATE TABLE comments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT,
  content   TEXT
);

-- Starting users
INSERT INTO users (username, password, role, email) VALUES
  ('admin',  'admin123',   'admin',   'admin@eduportal.com'),
  ('alice',  'alice2024',  'student', 'alice@eduportal.com'),
  ('bob',    'bobpass',    'student', 'bob@eduportal.com'),
  ('sara',   'sara777',    'student', 'sara@eduportal.com');

-- One starting comment
INSERT INTO comments (username, content) VALUES
  ('alice', 'Welcome to the Education Portal! Great course so far.');
