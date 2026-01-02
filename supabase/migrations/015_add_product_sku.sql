-- DB-018: Add product SKU (Stock Keeping Unit) field
-- SKU is a unique identifier for inventory management

-- Add SKU column
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(50);

-- Create unique index for SKU (partial index - only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique ON products(sku) WHERE sku IS NOT NULL;

-- Create regular index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Add comment
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier for inventory management';
