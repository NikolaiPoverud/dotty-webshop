-- DB-006: Make payment_session_id index unique
--
-- This ensures that each payment session can only create one order,
-- preventing duplicate orders from webhook retries or race conditions.
--
-- PREREQUISITE: Clean up any duplicate payment_session_id values first
-- Run this query to check for duplicates:
--   SELECT payment_session_id, COUNT(*)
--   FROM orders
--   WHERE payment_session_id IS NOT NULL
--   GROUP BY payment_session_id
--   HAVING COUNT(*) > 1;

-- First, check for duplicates and fail if any exist
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT payment_session_id
    FROM orders
    WHERE payment_session_id IS NOT NULL
    GROUP BY payment_session_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Found % duplicate payment_session_id values. Clean up duplicates before adding unique constraint.', duplicate_count;
  END IF;
END $$;

-- Drop the existing non-unique index if it exists
DROP INDEX IF EXISTS idx_orders_payment_session;

-- Create a unique index on payment_session_id
-- This also serves as the performance index for lookups
CREATE UNIQUE INDEX idx_orders_payment_session_unique
  ON orders(payment_session_id)
  WHERE payment_session_id IS NOT NULL;

-- Add a comment documenting the constraint
COMMENT ON INDEX idx_orders_payment_session_unique IS 'Ensures each payment session creates only one order, preventing duplicates from webhook retries';
