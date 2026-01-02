-- Add sequential order numbers (DOT-1, DOT-2, etc.)

-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- Add order_number column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Create a function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'DOT-' || nextval('order_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers on insert
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Backfill existing orders with numbers (ordered by created_at)
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
BEGIN
  -- First, find the max number we need to start from
  -- (in case some orders already have numbers)
  FOR r IN
    SELECT id FROM orders
    WHERE order_number IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE orders
    SET order_number = 'DOT-' || counter
    WHERE id = r.id;
    counter := counter + 1;
  END LOOP;

  -- Update the sequence to start after the highest used number
  PERFORM setval('order_number_seq',
    COALESCE(
      (SELECT MAX(CAST(REPLACE(order_number, 'DOT-', '') AS INTEGER)) FROM orders WHERE order_number LIKE 'DOT-%'),
      0
    ) + 1,
    false
  );
END $$;

-- Make order_number NOT NULL after backfill and add unique constraint
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Add comment for documentation
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number in format DOT-X';
