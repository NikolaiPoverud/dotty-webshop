-- Add shipping cost and size category to products
-- This allows per-product shipping configuration with size-based categories

-- Create shipping size enum for categorization
DO $$ BEGIN
  CREATE TYPE shipping_size AS ENUM ('small', 'medium', 'large', 'oversized');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add shipping columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_size shipping_size DEFAULT NULL;

-- Comments explaining the fields
COMMENT ON COLUMN products.shipping_cost IS 'Product-specific shipping cost in NOK øre (100 = 1 kr). NULL = use collection shipping cost. 0 = free shipping.';
COMMENT ON COLUMN products.shipping_size IS 'Shipping size category: small (prints up to A4), medium (prints up to A2), large (prints/originals up to 100cm), oversized (larger works requiring special handling)';

-- Add index for shipping queries
CREATE INDEX IF NOT EXISTS idx_products_shipping_size ON products(shipping_size) WHERE shipping_size IS NOT NULL;
