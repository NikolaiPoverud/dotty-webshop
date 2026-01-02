-- Migration: Add soft delete columns to relevant tables
-- Run this in Supabase SQL Editor

-- Products: soft delete
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- Contact submissions: soft delete
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_contact_deleted_at ON contact_submissions(deleted_at) WHERE deleted_at IS NULL;

-- Newsletter subscribers: soft delete (in addition to unsubscribed_at)
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_newsletter_deleted_at ON newsletter_subscribers(deleted_at) WHERE deleted_at IS NULL;

-- Discount codes: soft delete
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_discounts_deleted_at ON discount_codes(deleted_at) WHERE deleted_at IS NULL;

-- Testimonials: soft delete
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_testimonials_deleted_at ON testimonials(deleted_at) WHERE deleted_at IS NULL;

-- Collections: soft delete
ALTER TABLE collections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_collections_deleted_at ON collections(deleted_at) WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp - row is considered deleted when not null';
COMMENT ON COLUMN contact_submissions.deleted_at IS 'Soft delete timestamp - row is considered deleted when not null';
COMMENT ON COLUMN newsletter_subscribers.deleted_at IS 'Soft delete timestamp - row is considered deleted when not null';
COMMENT ON COLUMN discount_codes.deleted_at IS 'Soft delete timestamp - row is considered deleted when not null';
COMMENT ON COLUMN testimonials.deleted_at IS 'Soft delete timestamp - row is considered deleted when not null';
COMMENT ON COLUMN collections.deleted_at IS 'Soft delete timestamp - row is considered deleted when not null';
