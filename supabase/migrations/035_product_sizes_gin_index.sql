-- Migration 035: Add GIN index for product sizes JSONB column
-- DB-016: Enable efficient querying of product sizes
--
-- The sizes column stores: [{"width": 60, "height": 80, "label": "60x80 cm"}]
--
-- This index enables efficient queries like:
-- - Find products with specific dimensions
-- - Search for products offering certain size options
-- - Filter by width/height ranges

-- ============================================================================
-- GIN Index for JSONB containment queries
-- ============================================================================

-- GIN index for containment queries (@>, ?, ?|, ?& operators)
-- Example: WHERE sizes @> '[{"width": 60}]'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sizes_gin
ON products USING GIN (sizes jsonb_path_ops);

COMMENT ON INDEX idx_products_sizes_gin IS 'GIN index for efficient JSONB containment queries on product sizes';

-- ============================================================================
-- Helper Functions for Size Queries
-- ============================================================================

-- Find products that have a specific size (exact match)
CREATE OR REPLACE FUNCTION find_products_by_exact_size(
  p_width integer,
  p_height integer
)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM products p
  WHERE p.deleted_at IS NULL
    AND p.is_available = true
    AND p.sizes @> jsonb_build_array(
      jsonb_build_object('width', p_width, 'height', p_height)
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_products_by_exact_size IS 'Find products that offer a specific width x height size';

-- Find products within a size range
CREATE OR REPLACE FUNCTION find_products_by_size_range(
  p_min_width integer DEFAULT NULL,
  p_max_width integer DEFAULT NULL,
  p_min_height integer DEFAULT NULL,
  p_max_height integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  price integer,
  image_url text,
  product_type text,
  sizes jsonb,
  matching_sizes jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.price,
    p.image_url,
    p.product_type,
    p.sizes,
    -- Return only the sizes that match the criteria
    jsonb_agg(s) FILTER (WHERE s IS NOT NULL) AS matching_sizes
  FROM products p,
    jsonb_array_elements(p.sizes) AS s
  WHERE p.deleted_at IS NULL
    AND p.is_available = true
    AND (p_min_width IS NULL OR (s->>'width')::integer >= p_min_width)
    AND (p_max_width IS NULL OR (s->>'width')::integer <= p_max_width)
    AND (p_min_height IS NULL OR (s->>'height')::integer >= p_min_height)
    AND (p_max_height IS NULL OR (s->>'height')::integer <= p_max_height)
  GROUP BY p.id, p.title, p.slug, p.price, p.image_url, p.product_type, p.sizes;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_products_by_size_range IS 'Find products with sizes within specified width/height ranges';

-- Get all unique sizes offered across all products
CREATE OR REPLACE FUNCTION get_all_available_sizes()
RETURNS TABLE (
  width integer,
  height integer,
  label text,
  product_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (s->>'width')::integer AS width,
    (s->>'height')::integer AS height,
    s->>'label' AS label,
    COUNT(DISTINCT p.id) AS product_count
  FROM products p,
    jsonb_array_elements(p.sizes) AS s
  WHERE p.deleted_at IS NULL
    AND p.is_available = true
  GROUP BY (s->>'width')::integer, (s->>'height')::integer, s->>'label'
  ORDER BY (s->>'width')::integer, (s->>'height')::integer;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_all_available_sizes IS 'Get all unique sizes available across products with counts';

-- ============================================================================
-- Example Queries (for reference)
-- ============================================================================

-- Find products with width 60cm:
-- SELECT * FROM products WHERE sizes @> '[{"width": 60}]';

-- Find products with exactly 60x80cm:
-- SELECT * FROM find_products_by_exact_size(60, 80);

-- Find products with width between 40-60cm:
-- SELECT * FROM find_products_by_size_range(p_min_width := 40, p_max_width := 60);

-- Get all available sizes:
-- SELECT * FROM get_all_available_sizes();
