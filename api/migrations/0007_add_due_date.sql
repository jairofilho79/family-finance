ALTER TABLE transactions ADD COLUMN due_date INTEGER;
UPDATE transactions SET due_date = date WHERE due_date IS NULL;
