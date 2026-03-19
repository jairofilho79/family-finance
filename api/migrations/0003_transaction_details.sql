-- Migration number: 0003 	 2026-02-26T22:15:00.000Z
-- Add payment_description to transactions
ALTER TABLE transactions ADD COLUMN payment_description TEXT;

-- Create transaction_edits table
CREATE TABLE transaction_edits (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,          -- User who made the edit
  field_name TEXT NOT NULL,       -- e.g., 'amount', 'date', 'description'
  old_value TEXT,                 -- Stored as TEXT for simplicity, parsed on frontend if needed
  new_value TEXT,                 -- Same as above
  created_at INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create transaction_status_history table
CREATE TABLE transaction_status_history (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,          -- User who triggered the status change
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
