-- Migration: Add is_public visibility toggle for products and collections
-- Allows hiding items from public shop/landing pages without deleting them

-- Add is_public to products (default true for backwards compatibility)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Add is_public to collections (default true for backwards compatibility)
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Add index for efficient filtering on public queries
CREATE INDEX IF NOT EXISTS idx_products_is_public ON products (is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections (is_public) WHERE is_public = true;

-- Update the active_products view to include is_public filter
DROP VIEW IF EXISTS active_products;
CREATE VIEW active_products AS
SELECT *
FROM products
WHERE deleted_at IS NULL
  AND is_public = true;

-- Update the active_collections view to include is_public filter
DROP VIEW IF EXISTS active_collections;
CREATE VIEW active_collections AS
SELECT *
FROM collections
WHERE deleted_at IS NULL
  AND is_public = true;

COMMENT ON COLUMN products.is_public IS 'Whether the product is visible on public pages (shop, landing). Hidden products can still be accessed directly via URL.';
COMMENT ON COLUMN collections.is_public IS 'Whether the collection is visible on public pages. Hidden collections will not show in navigation.';
