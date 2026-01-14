-- DB-012: Add updated_at triggers to discount_codes and collections
-- Ensures updated_at is automatically maintained on updates

-- Generic updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to discount_codes if it doesn't exist
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger for discount_codes
DROP TRIGGER IF EXISTS set_updated_at_discount_codes ON discount_codes;
CREATE TRIGGER set_updated_at_discount_codes
BEFORE UPDATE ON discount_codes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

-- Trigger for collections (if updated_at exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'collections' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_collections ON collections;
    CREATE TRIGGER set_updated_at_collections
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END $$;

COMMENT ON FUNCTION trigger_set_updated_at IS
  'Generic trigger function to auto-update updated_at column';
