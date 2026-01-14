-- DB-008: Add CHECK constraint to prevent negative stock_quantity
-- This prevents inventory from going negative due to race conditions or bugs

-- Stock must be either NULL (for originals) or non-negative (for prints)
ALTER TABLE products ADD CONSTRAINT products_stock_non_negative
CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

COMMENT ON CONSTRAINT products_stock_non_negative ON products IS
  'Ensures stock_quantity cannot go negative. NULL is allowed for originals.';
