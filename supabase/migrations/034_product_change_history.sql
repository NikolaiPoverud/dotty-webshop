-- Migration 034: Add product change history table
-- DB-015: Track all changes to products for audit and rollback purposes
--
-- Benefits:
-- - Full audit trail of product modifications
-- - Ability to see who changed what and when
-- - Support for rollback to previous versions
-- - Compliance and dispute resolution

-- ============================================================================
-- Product History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Change metadata
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by text, -- admin email or 'system'
  changed_at timestamptz NOT NULL DEFAULT NOW(),
  change_reason text, -- optional reason for change

  -- Snapshot of product state BEFORE the change (null for INSERT)
  old_data jsonb,

  -- Snapshot of product state AFTER the change (null for DELETE)
  new_data jsonb,

  -- List of fields that changed (for UPDATE operations)
  changed_fields text[],

  -- Request context for debugging
  request_id text,
  user_agent text,
  ip_address text
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_product_history_product_id ON product_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_changed_at ON product_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_history_operation ON product_history(operation);
CREATE INDEX IF NOT EXISTS idx_product_history_changed_by ON product_history(changed_by) WHERE changed_by IS NOT NULL;

COMMENT ON TABLE product_history IS 'Audit trail of all product changes';
COMMENT ON COLUMN product_history.old_data IS 'Product state before the change (null for INSERT)';
COMMENT ON COLUMN product_history.new_data IS 'Product state after the change (null for DELETE)';
COMMENT ON COLUMN product_history.changed_fields IS 'Array of field names that were modified';

-- ============================================================================
-- Automatic History Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION record_product_change()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields text[];
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_changed_fields := NULL;

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);

    -- Calculate which fields changed
    SELECT array_agg(key) INTO v_changed_fields
    FROM (
      SELECT key
      FROM jsonb_each(v_old_data)
      WHERE v_old_data->key IS DISTINCT FROM v_new_data->key
      UNION
      SELECT key
      FROM jsonb_each(v_new_data)
      WHERE v_old_data->key IS DISTINCT FROM v_new_data->key
    ) AS changed_keys;

    -- Skip if only updated_at changed (avoid noise from automatic triggers)
    IF v_changed_fields = ARRAY['updated_at']::text[] THEN
      RETURN NEW;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_changed_fields := NULL;
  END IF;

  -- Insert history record
  INSERT INTO product_history (
    product_id,
    operation,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old_data,
    v_new_data,
    v_changed_fields
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Apply Trigger to Products Table
-- ============================================================================

DROP TRIGGER IF EXISTS products_history_trigger ON products;

CREATE TRIGGER products_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION record_product_change();

-- ============================================================================
-- Helper Function: Get Product History
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_history(
  p_product_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  operation text,
  changed_by text,
  changed_at timestamptz,
  change_reason text,
  changed_fields text[],
  old_data jsonb,
  new_data jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.operation,
    h.changed_by,
    h.changed_at,
    h.change_reason,
    h.changed_fields,
    h.old_data,
    h.new_data
  FROM product_history h
  WHERE h.product_id = p_product_id
  ORDER BY h.changed_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper Function: Revert Product to Previous State
-- ============================================================================

CREATE OR REPLACE FUNCTION revert_product_to_version(
  p_history_id uuid,
  p_changed_by text DEFAULT 'system'
)
RETURNS uuid AS $$
DECLARE
  v_history record;
  v_product_id uuid;
BEGIN
  -- Get the history record
  SELECT * INTO v_history FROM product_history WHERE id = p_history_id;

  IF v_history IS NULL THEN
    RAISE EXCEPTION 'History record not found: %', p_history_id;
  END IF;

  IF v_history.old_data IS NULL THEN
    RAISE EXCEPTION 'Cannot revert - no previous state available (this was an INSERT)';
  END IF;

  v_product_id := v_history.product_id;

  -- Update the product with the old data
  UPDATE products SET
    title = (v_history.old_data->>'title')::text,
    description = (v_history.old_data->>'description')::text,
    slug = (v_history.old_data->>'slug')::text,
    price = (v_history.old_data->>'price')::integer,
    image_url = (v_history.old_data->>'image_url')::text,
    image_path = (v_history.old_data->>'image_path')::text,
    product_type = (v_history.old_data->>'product_type')::text,
    stock_quantity = (v_history.old_data->>'stock_quantity')::integer,
    collection_id = (v_history.old_data->>'collection_id')::uuid,
    is_available = (v_history.old_data->>'is_available')::boolean,
    is_featured = (v_history.old_data->>'is_featured')::boolean,
    display_order = (v_history.old_data->>'display_order')::integer,
    deleted_at = (v_history.old_data->>'deleted_at')::timestamptz,
    sku = (v_history.old_data->>'sku')::text
  WHERE id = v_product_id;

  -- Record who performed the revert
  UPDATE product_history
  SET changed_by = p_changed_by,
      change_reason = 'Reverted from history record: ' || p_history_id::text
  WHERE id = (
    SELECT id FROM product_history
    WHERE product_id = v_product_id
    ORDER BY changed_at DESC
    LIMIT 1
  );

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;

-- No public access - service role only
-- This is intentional as history is admin-only data

-- ============================================================================
-- Cleanup Function (optional - to prevent table from growing too large)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_product_history(
  p_months_to_keep integer DEFAULT 24
)
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM product_history
  WHERE changed_at < NOW() - (p_months_to_keep || ' months')::interval;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_product_history IS 'Remove product history older than specified months (default 24)';
