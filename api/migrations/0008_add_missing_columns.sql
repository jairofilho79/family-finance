-- Migration number: 0008 	 2026-02-27T04:53:00.000Z
-- Re-add columns lost during migration 0006 (table recreation dropped details and payment_description)
ALTER TABLE transactions ADD COLUMN details TEXT;
ALTER TABLE transactions ADD COLUMN payment_description TEXT;
