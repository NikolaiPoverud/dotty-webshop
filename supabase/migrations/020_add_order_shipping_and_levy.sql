-- Add shipping_cost and artist_levy columns to orders table

-- Add shipping_cost column (in NOK øre)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0;

-- Add artist_levy column (5% kunsteravgift for art over 2500 NOK)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS artist_levy INTEGER DEFAULT 0;

-- Update process_order function to accept new fields
CREATE OR REPLACE FUNCTION process_order(
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_items jsonb,
  p_subtotal integer,
  p_discount_code text,
  p_discount_amount integer,
  p_shipping_cost integer DEFAULT 0,
  p_artist_levy integer DEFAULT 0,
  p_total integer,
  p_payment_session_id text
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_item record;
  v_stock_result record;
  v_discount_remaining integer;
  v_result jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_items_processed jsonb := '[]'::jsonb;
BEGIN
  -- Check for existing order (idempotency)
  SELECT id INTO v_order_id
  FROM orders
  WHERE payment_session_id = p_payment_session_id;

  IF v_order_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', v_order_id,
      'message', 'Order already exists (idempotent)',
      'is_duplicate', true
    );
  END IF;

  -- Create the order
  INSERT INTO orders (
    customer_email,
    customer_name,
    customer_phone,
    shipping_address,
    items,
    subtotal,
    discount_code,
    discount_amount,
    shipping_cost,
    artist_levy,
    total,
    payment_provider,
    payment_session_id,
    status
  ) VALUES (
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_shipping_address,
    p_items,
    p_subtotal,
    p_discount_code,
    p_discount_amount,
    COALESCE(p_shipping_cost, 0),
    COALESCE(p_artist_levy, 0),
    p_total,
    'stripe',
    p_payment_session_id,
    'paid'
  ) RETURNING id INTO v_order_id;

  -- Also insert into order_items table (normalized)
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id text,
    title text,
    price integer,
    quantity integer,
    image_url text
  )
  LOOP
    INSERT INTO order_items (order_id, product_id, title, price, quantity, image_url)
    VALUES (
      v_order_id,
      v_item.product_id::uuid,
      COALESCE(v_item.title, 'Unknown Product'),
      COALESCE(v_item.price, 0),
      COALESCE(v_item.quantity, 1),
      v_item.image_url
    );
  END LOOP;

  -- Decrement discount code if used
  IF p_discount_code IS NOT NULL AND p_discount_code != '' THEN
    UPDATE discount_codes
    SET uses_remaining = GREATEST(0, uses_remaining - 1)
    WHERE code = UPPER(p_discount_code)
      AND uses_remaining IS NOT NULL
      AND uses_remaining > 0
    RETURNING uses_remaining INTO v_discount_remaining;

    IF v_discount_remaining IS NOT NULL THEN
      RAISE NOTICE 'Discount code % decremented, remaining: %', p_discount_code, v_discount_remaining;
    END IF;
  END IF;

  -- Update inventory for each item
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id text,
    quantity integer
  )
  LOOP
    -- Use the existing atomic stock function
    SELECT * INTO v_stock_result FROM decrement_product_stock(
      v_item.product_id::uuid,
      COALESCE(v_item.quantity, 1)
    );

    IF v_stock_result IS NOT NULL THEN
      IF v_stock_result.success THEN
        v_items_processed := v_items_processed || jsonb_build_object(
          'product_id', v_item.product_id,
          'new_stock', v_stock_result.new_stock,
          'product_type', v_stock_result.product_type
        );
      ELSE
        v_errors := v_errors || jsonb_build_object(
          'product_id', v_item.product_id,
          'error', v_stock_result.error_message
        );
      END IF;
    END IF;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'is_duplicate', false,
    'items_processed', v_items_processed,
    'errors', v_errors
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will automatically rollback
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_order TO service_role;

COMMENT ON FUNCTION process_order IS 'Atomic order processing: creates order with shipping/levy, updates inventory, decrements discount code';
