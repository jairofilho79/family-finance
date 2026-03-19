-- Migration number: 0006 	 2026-02-27T02:44:44.994Z

PRAGMA defer_foreign_keys=TRUE;

CREATE TABLE transactions_new (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payer_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  date INTEGER NOT NULL,
  type TEXT NOT NULL,
  group_id TEXT,
  installment_number INTEGER,
  total_installments INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at INTEGER,
  is_personal INTEGER DEFAULT 0,
  FOREIGN KEY (payer_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

INSERT INTO transactions_new (
  id, description, amount, payer_id, receiver_id, created_by, created_at, date, type, group_id, installment_number, total_installments, status, paid_at, is_personal
)
SELECT id, description, amount, payer_id, receiver_id, created_by, created_at, date, type, group_id, installment_number, total_installments, status, paid_at, is_personal
FROM transactions;

DROP TABLE transactions;

ALTER TABLE transactions_new RENAME TO transactions;
