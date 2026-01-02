-- DB-006: Add missing indexes for performance and security

-- Index for Stripe webhook idempotency check (SEC-004)
-- Note: Using non-unique index due to existing duplicate data that needs cleanup
CREATE INDEX IF NOT EXISTS idx_orders_payment_session_id
ON orders(payment_session_id)
WHERE payment_session_id IS NOT NULL;

-- Index for shop page sorting (products by collection, availability, display order)
CREATE INDEX IF NOT EXISTS idx_products_shop_sort
ON products(collection_id, is_available, display_order);

-- Index for orders by date (admin dashboard queries)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at DESC);

-- Index for orders by status (order management)
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at DESC);

-- Index for discount codes by code (case-insensitive lookups)
CREATE INDEX IF NOT EXISTS idx_discount_codes_code_upper
ON discount_codes(UPPER(code));
