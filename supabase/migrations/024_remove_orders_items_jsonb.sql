-- DB-003: Remove deprecated JSONB items column from orders table
--
-- The items data has been migrated to the order_items junction table
-- (migration 012_order_items_junction_table.sql).
-- This migration removes the redundant JSONB column to:
-- 1. Reduce storage overhead
-- 2. Eliminate data duplication
-- 3. Enforce single source of truth (order_items table)
--
-- PREREQUISITES:
-- - Ensure migration 012 has been run and data migrated
-- - Verify all application code uses order_items table
-- - The orders_with_items view provides backward compatibility

-- First, verify data integrity (this will fail if there are orders without items)
DO $$
DECLARE
  orders_without_items INTEGER;
BEGIN
  SELECT COUNT(*) INTO orders_without_items
  FROM orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
  )
  AND (o.items IS NOT NULL AND jsonb_array_length(o.items) > 0);

  IF orders_without_items > 0 THEN
    RAISE EXCEPTION 'Found % orders with items in JSONB but not in order_items table. Run migration 012 first.', orders_without_items;
  END IF;
END $$;

-- Drop the JSONB items column
ALTER TABLE orders DROP COLUMN IF EXISTS items;

-- Update table comment
COMMENT ON TABLE orders IS 'Customer orders - items are stored in order_items junction table';
