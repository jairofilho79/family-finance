-- Migration number: 0001 	 2026-02-25T00:18:29.000Z
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  theme TEXT DEFAULT 'light',
  font_size TEXT DEFAULT 'normal'
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payer_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  date INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'single' | 'installment' | 'subscription'
  group_id TEXT,
  installment_number INTEGER,
  total_installments INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'cancelled'
  paid_at INTEGER,
  FOREIGN KEY (payer_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
