-- Migration number: 0004 	 2026-02-26T22:40:00.000Z

-- Add group_recurring setting to users
ALTER TABLE users ADD COLUMN group_recurring INTEGER DEFAULT 1;

-- Create recurring_purchases table for shortcuts
CREATE TABLE recurring_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL, 
  payment_description TEXT,
  payer_id TEXT,
  receiver_id TEXT,
  order_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
