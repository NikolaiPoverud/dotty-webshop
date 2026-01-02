-- DB-005: Create order_items junction table
-- Normalizes the orders.items JSONB column into a proper relational table
-- Benefits: Better query performance, referential integrity, easier reporting

-- Create the order_items junction table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  -- Denormalized fields (snapshot at time of order)
  title text NOT NULL,
  price integer NOT NULL, -- Price in øre at time of purchase
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  image_url text,
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Enable RLS (no public access, admin only via service_role)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Migrate existing data from JSONB to junction table
-- This is safe to run multiple times (uses INSERT ... ON CONFLICT DO NOTHING would need unique constraint)
DO $$
DECLARE
  order_record RECORD;
  item_record RECORD;
BEGIN
  -- Loop through all orders with items
  FOR order_record IN
    SELECT id, items
    FROM orders
    WHERE items IS NOT NULL
      AND jsonb_array_length(items) > 0
  LOOP
    -- Loop through each item in the order
    FOR item_record IN
      SELECT * FROM jsonb_to_recordset(order_record.items) AS x(
        product_id text,
        title text,
        price integer,
        quantity integer,
        image_url text
      )
    LOOP
      -- Check if this item already exists (avoid duplicates on re-run)
      IF NOT EXISTS (
        SELECT 1 FROM order_items
        WHERE order_id = order_record.id
          AND product_id = item_record.product_id::uuid
      ) THEN
        INSERT INTO order_items (order_id, product_id, title, price, quantity, image_url)
        VALUES (
          order_record.id,
          item_record.product_id::uuid,
          COALESCE(item_record.title, 'Unknown Product'),
          COALESCE(item_record.price, 0),
          COALESCE(item_record.quantity, 1),
          item_record.image_url
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Create a view for backward compatibility (optional, for gradual migration)
CREATE OR REPLACE VIEW orders_with_items AS
SELECT
  o.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'product_id', oi.product_id,
        'title', oi.title,
        'price', oi.price,
        'quantity', oi.quantity,
        'image_url', oi.image_url
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::jsonb
  ) AS items_normalized
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Helper function to get order items
CREATE OR REPLACE FUNCTION get_order_items(p_order_id uuid)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  title text,
  price integer,
  quantity integer,
  image_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT oi.id, oi.product_id, oi.title, oi.price, oi.quantity, oi.image_url
  FROM order_items oi
  WHERE oi.order_id = p_order_id
  ORDER BY oi.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE order_items IS 'Normalized order line items - junction table between orders and products';
COMMENT ON COLUMN order_items.title IS 'Product title snapshot at time of order (denormalized for historical accuracy)';
COMMENT ON COLUMN order_items.price IS 'Product price in øre at time of order (denormalized for historical accuracy)';
