-- Rollback: Remove indexes added in 009_add_missing_indexes.sql

DROP INDEX IF EXISTS idx_products_shop_sort;
DROP INDEX IF EXISTS idx_products_featured;
DROP INDEX IF EXISTS idx_products_collection;
DROP INDEX IF EXISTS idx_orders_status_created;
DROP INDEX IF EXISTS idx_orders_date_range;
DROP INDEX IF EXISTS idx_newsletter_confirmed;
DROP INDEX IF EXISTS idx_newsletter_email;
DROP INDEX IF EXISTS idx_discount_codes_code;
