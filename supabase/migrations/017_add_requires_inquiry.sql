-- Migration: Add requires_inquiry field to products
-- Products with this flag cannot be purchased directly - customers must inquire first

ALTER TABLE products
ADD COLUMN IF NOT EXISTS requires_inquiry BOOLEAN DEFAULT FALSE;

-- Add a comment explaining the field
COMMENT ON COLUMN products.requires_inquiry IS 'If true, product cannot be added to cart - customer must submit inquiry';
