-- Rollback: Remove soft delete columns
-- WARNING: This will permanently lose soft-delete tracking data

ALTER TABLE products DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE products DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE collections DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE collections DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE orders DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE orders DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE discount_codes DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE discount_codes DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE testimonials DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE testimonials DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE contact_submissions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contact_submissions DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE newsletter_subscribers DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE newsletter_subscribers DROP COLUMN IF EXISTS deleted_by;
