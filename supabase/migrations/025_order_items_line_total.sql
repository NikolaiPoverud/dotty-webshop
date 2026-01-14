-- DB-007: Add line_total computed column to order_items
-- This ensures data integrity by computing line_total = price * quantity

-- Add the computed column (GENERATED ALWAYS means it auto-updates)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total INTEGER
GENERATED ALWAYS AS (price * quantity) STORED;

-- Add an index for queries that sum line totals
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

COMMENT ON COLUMN order_items.line_total IS
  'Computed column: price * quantity. Cannot be directly modified.';
