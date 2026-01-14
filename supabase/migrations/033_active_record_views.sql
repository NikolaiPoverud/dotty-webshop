-- Migration 033: Create views for active records
-- DB-014: Simplifies queries by pre-filtering deleted records
--
-- Benefits:
-- - Cleaner queries without repeated deleted_at IS NULL checks
-- - Consistent filtering logic in one place
-- - Self-documenting schema
-- - Can be used by both application code and admin queries

-- ============================================================================
-- Products Views
-- ============================================================================

-- Active products (not deleted, available for sale)
CREATE OR REPLACE VIEW active_products AS
SELECT
  p.*,
  c.name AS collection_name,
  c.slug AS collection_slug
FROM products p
LEFT JOIN collections c ON p.collection_id = c.id AND c.deleted_at IS NULL
WHERE p.deleted_at IS NULL
  AND p.is_available = true;

COMMENT ON VIEW active_products IS 'Products available for sale (not deleted, is_available = true)';

-- All non-deleted products (for admin)
CREATE OR REPLACE VIEW visible_products AS
SELECT
  p.*,
  c.name AS collection_name,
  c.slug AS collection_slug
FROM products p
LEFT JOIN collections c ON p.collection_id = c.id AND c.deleted_at IS NULL
WHERE p.deleted_at IS NULL;

COMMENT ON VIEW visible_products IS 'All non-deleted products including unavailable (for admin views)';

-- Featured products (for homepage)
CREATE OR REPLACE VIEW featured_products AS
SELECT * FROM active_products
WHERE is_featured = true
ORDER BY display_order ASC;

COMMENT ON VIEW featured_products IS 'Featured products for homepage display';

-- ============================================================================
-- Collections Views
-- ============================================================================

-- Active collections (not deleted)
CREATE OR REPLACE VIEW active_collections AS
SELECT
  c.*,
  COUNT(p.id) AS product_count,
  COUNT(CASE WHEN p.is_available THEN 1 END) AS available_product_count
FROM collections c
LEFT JOIN products p ON p.collection_id = c.id AND p.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id
ORDER BY c.display_order ASC;

COMMENT ON VIEW active_collections IS 'Active collections with product counts';

-- ============================================================================
-- Discount Codes Views
-- ============================================================================

-- Usable discount codes (active, not deleted, not expired, uses remaining)
CREATE OR REPLACE VIEW usable_discount_codes AS
SELECT * FROM discount_codes
WHERE deleted_at IS NULL
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (uses_remaining IS NULL OR uses_remaining > 0);

COMMENT ON VIEW usable_discount_codes IS 'Discount codes that can currently be applied';

-- All non-deleted discount codes (for admin)
CREATE OR REPLACE VIEW visible_discount_codes AS
SELECT
  dc.*,
  CASE
    WHEN dc.is_active = false THEN 'inactive'
    WHEN dc.expires_at IS NOT NULL AND dc.expires_at <= NOW() THEN 'expired'
    WHEN dc.uses_remaining IS NOT NULL AND dc.uses_remaining <= 0 THEN 'exhausted'
    ELSE 'active'
  END AS status_label
FROM discount_codes dc
WHERE dc.deleted_at IS NULL;

COMMENT ON VIEW visible_discount_codes IS 'All non-deleted discount codes with status label (for admin)';

-- ============================================================================
-- Testimonials Views
-- ============================================================================

-- Visible testimonials (not deleted)
CREATE OR REPLACE VIEW active_testimonials AS
SELECT * FROM testimonials
WHERE deleted_at IS NULL
ORDER BY display_order ASC, created_at DESC;

COMMENT ON VIEW active_testimonials IS 'Active testimonials for public display';

-- ============================================================================
-- Newsletter Views
-- ============================================================================

-- Active subscribers (not deleted, not unsubscribed)
CREATE OR REPLACE VIEW active_newsletter_subscribers AS
SELECT * FROM newsletter_subscribers
WHERE deleted_at IS NULL
  AND unsubscribed_at IS NULL;

COMMENT ON VIEW active_newsletter_subscribers IS 'Currently subscribed newsletter recipients';

-- ============================================================================
-- Orders Views (no soft delete, but useful aggregations)
-- ============================================================================

-- Orders with item counts
CREATE OR REPLACE VIEW orders_summary AS
SELECT
  o.id,
  o.order_number,
  o.customer_email,
  o.customer_name,
  o.status,
  o.payment_provider,
  o.subtotal,
  o.discount_amount,
  o.shipping_cost,
  o.artist_levy,
  o.total,
  o.created_at,
  o.updated_at,
  COUNT(oi.id) AS item_count,
  SUM(oi.quantity) AS total_quantity
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

COMMENT ON VIEW orders_summary IS 'Orders with aggregated item counts';

-- Recent paid orders (last 30 days)
CREATE OR REPLACE VIEW recent_paid_orders AS
SELECT * FROM orders_summary
WHERE status IN ('paid', 'shipped', 'delivered')
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

COMMENT ON VIEW recent_paid_orders IS 'Paid orders from last 30 days';

-- ============================================================================
-- Grant appropriate permissions
-- ============================================================================

-- Public views (readable via anon key)
GRANT SELECT ON active_products TO anon, authenticated;
GRANT SELECT ON featured_products TO anon, authenticated;
GRANT SELECT ON active_collections TO anon, authenticated;
GRANT SELECT ON usable_discount_codes TO anon, authenticated;
GRANT SELECT ON active_testimonials TO anon, authenticated;

-- Admin views (readable via service role only - default)
-- visible_products, visible_discount_codes, orders_summary, recent_paid_orders
-- are accessible only via service role by default
