-- Phase 1.1: Materialized View for Facet Counts
-- Enables fast facet counting without scanning products table on every request

-- Create materialized view for facet counts with aggregated statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS facet_product_counts AS
SELECT
  product_type,
  year,
  shipping_size,
  CASE
    WHEN price < 250000 THEN 'under-2500'
    WHEN price < 500000 THEN '2500-5000'
    WHEN price < 1000000 THEN '5000-10000'
    WHEN price < 2500000 THEN '10000-25000'
    ELSE 'over-25000'
  END as price_range,
  collection_id,
  COUNT(*) as product_count,
  MIN(price) as min_price,
  MAX(price) as max_price,
  AVG(price)::INTEGER as avg_price
FROM products
WHERE is_public = true AND deleted_at IS NULL AND is_available = true
GROUP BY GROUPING SETS (
  (product_type),
  (year),
  (shipping_size),
  (CASE
    WHEN price < 250000 THEN 'under-2500'
    WHEN price < 500000 THEN '2500-5000'
    WHEN price < 1000000 THEN '5000-10000'
    WHEN price < 2500000 THEN '10000-25000'
    ELSE 'over-25000'
  END),
  (collection_id),
  (product_type, year),
  (product_type, shipping_size),
  (product_type, CASE
    WHEN price < 250000 THEN 'under-2500'
    WHEN price < 500000 THEN '2500-5000'
    WHEN price < 1000000 THEN '5000-10000'
    WHEN price < 2500000 THEN '10000-25000'
    ELSE 'over-25000'
  END)
);

-- Create indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_type
  ON facet_product_counts (product_type)
  WHERE year IS NULL AND shipping_size IS NULL AND price_range IS NULL AND collection_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_year
  ON facet_product_counts (year)
  WHERE product_type IS NULL AND shipping_size IS NULL AND price_range IS NULL AND collection_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_size
  ON facet_product_counts (shipping_size)
  WHERE product_type IS NULL AND year IS NULL AND price_range IS NULL AND collection_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_price
  ON facet_product_counts (price_range)
  WHERE product_type IS NULL AND year IS NULL AND shipping_size IS NULL AND collection_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_collection
  ON facet_product_counts (collection_id)
  WHERE product_type IS NULL AND year IS NULL AND shipping_size IS NULL AND price_range IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_type_year
  ON facet_product_counts (product_type, year)
  WHERE shipping_size IS NULL AND price_range IS NULL AND collection_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_type_size
  ON facet_product_counts (product_type, shipping_size)
  WHERE year IS NULL AND price_range IS NULL AND collection_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facet_counts_type_price
  ON facet_product_counts (product_type, price_range)
  WHERE year IS NULL AND shipping_size IS NULL AND collection_id IS NULL;

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_facet_product_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY facet_product_counts;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON facet_product_counts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_facet_product_counts() TO service_role;

-- Comment for documentation
COMMENT ON MATERIALIZED VIEW facet_product_counts IS
  'Aggregated facet counts for SEO pages. Refresh hourly via cron job.';
