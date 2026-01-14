-- DB-005: Add cascade trigger for collection soft delete
-- When a collection is soft-deleted, nullify the collection_id on associated products

CREATE OR REPLACE FUNCTION cascade_collection_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when deleted_at changes from NULL to a value
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE products
    SET collection_id = NULL, updated_at = NOW()
    WHERE collection_id = OLD.id;

    RAISE NOTICE 'Soft-deleted collection %, removed from % products',
      OLD.id, (SELECT COUNT(*) FROM products WHERE collection_id IS NULL AND updated_at = NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS collection_soft_delete_cascade ON collections;

-- Create the trigger
CREATE TRIGGER collection_soft_delete_cascade
AFTER UPDATE ON collections
FOR EACH ROW
EXECUTE FUNCTION cascade_collection_soft_delete();

COMMENT ON FUNCTION cascade_collection_soft_delete IS
  'Removes collection_id from products when their collection is soft-deleted';
