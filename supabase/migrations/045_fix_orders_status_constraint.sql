-- Fix orders_status_check constraint to include 'cancelled'
-- The constraint was missing 'cancelled' which prevented order cancellation

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
CHECK (status = ANY (ARRAY['pending', 'paid', 'shipped', 'delivered', 'cancelled']));

COMMENT ON CONSTRAINT orders_status_check ON orders IS 'Validates order status values including cancelled';
