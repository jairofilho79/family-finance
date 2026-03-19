-- Migration number: 0002 	 2026-02-25T01:36:00.000Z
CREATE TABLE invites (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  used_by TEXT,
  created_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id)
);
