-- SEC-012: Add index on orders.payment_session_id for faster lookups
-- This improves webhook idempotency checks and order queries by payment session
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_session_id
ON orders(payment_session_id) WHERE payment_session_id IS NOT NULL;

-- DB-009: Add composite index for shop page queries
-- Products are frequently queried by active status and sorted by display_order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_sorted
ON products(display_order) WHERE deleted_at IS NULL AND is_available = true;

-- Additional useful indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured
ON products(display_order) WHERE deleted_at IS NULL AND is_featured = true;

COMMENT ON INDEX idx_orders_payment_session_id IS
  'Speeds up webhook idempotency checks and payment session lookups';
COMMENT ON INDEX idx_products_active_sorted IS
  'Optimizes shop page queries for active products sorted by display_order';
