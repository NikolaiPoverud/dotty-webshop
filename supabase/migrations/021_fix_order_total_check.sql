-- DB-001: Fix order total CHECK constraint
-- The original constraint (migration 011) only accounted for subtotal - discount_amount
-- After adding shipping_cost and artist_levy (migration 020), the constraint needs updating

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_total_check;

-- Add the corrected constraint that includes shipping_cost and artist_levy
ALTER TABLE orders ADD CONSTRAINT orders_total_check
CHECK (total = subtotal + COALESCE(shipping_cost, 0) + COALESCE(artist_levy, 0) - discount_amount);

COMMENT ON CONSTRAINT orders_total_check ON orders IS
  'Ensures order total equals subtotal + shipping + artist_levy - discount';
