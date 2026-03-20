-- Migration number: 0009 	 2026-03-20T00:00:00.000Z
-- Make "payment_methods" shareable across users via a shared identifier.
-- This enables sharing both the item itself and its image_url.

ALTER TABLE payment_methods ADD COLUMN shared_id TEXT;

-- Backfill for existing rows.
-- Deterministic grouping by name so default and any previously created items
-- become shared between users.
UPDATE payment_methods
SET shared_id = lower(trim(name))
WHERE shared_id IS NULL;
