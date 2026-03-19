-- Migration number: 0005 	 2026-02-27T02:41:39.906Z

CREATE TABLE payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

ALTER TABLE transactions ADD COLUMN is_personal INTEGER DEFAULT 0;

INSERT INTO payment_methods (id, user_id, name, order_index, created_at)
SELECT lower(hex(randomblob(16))), id, 'Bradesco', 0, CAST(strftime('%s', 'now') * 1000 AS INTEGER) FROM users;

INSERT INTO payment_methods (id, user_id, name, order_index, created_at)
SELECT lower(hex(randomblob(16))), id, 'Pix', 1, CAST(strftime('%s', 'now') * 1000 AS INTEGER) FROM users;

INSERT INTO payment_methods (id, user_id, name, order_index, created_at)
SELECT lower(hex(randomblob(16))), id, 'Mercado Pago', 2, CAST(strftime('%s', 'now') * 1000 AS INTEGER) FROM users;

INSERT INTO payment_methods (id, user_id, name, order_index, created_at)
SELECT lower(hex(randomblob(16))), id, 'Boleto Bancário', 3, CAST(strftime('%s', 'now') * 1000 AS INTEGER) FROM users;

INSERT INTO payment_methods (id, user_id, name, order_index, created_at)
SELECT lower(hex(randomblob(16))), id, 'Nubank', 4, CAST(strftime('%s', 'now') * 1000 AS INTEGER) FROM users;

INSERT INTO payment_methods (id, user_id, name, order_index, created_at)
SELECT lower(hex(randomblob(16))), id, 'Itaú', 5, CAST(strftime('%s', 'now') * 1000 AS INTEGER) FROM users;

INSERT INTO payment_methods (id, user_id, name, order_index, created_at)
SELECT lower(hex(randomblob(16))), id, 'Meliuz', 6, CAST(strftime('%s', 'now') * 1000 AS INTEGER) FROM users;
