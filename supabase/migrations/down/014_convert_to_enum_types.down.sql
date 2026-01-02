-- Rollback: Convert ENUM types back to TEXT with CHECK constraints
-- WARNING: This rollback should only be run if needed to restore previous state

-- 1. Convert products.product_type back to TEXT
ALTER TABLE products
  ALTER COLUMN product_type TYPE text
  USING product_type::text;
ALTER TABLE products
  ALTER COLUMN product_type SET DEFAULT 'original';
ALTER TABLE products
  ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('original', 'print'));

-- 2. Convert orders.status back to TEXT
ALTER TABLE orders
  ALTER COLUMN status TYPE text
  USING status::text;
ALTER TABLE orders
  ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled'));

-- 3. Convert orders.payment_provider back to TEXT
ALTER TABLE orders
  ALTER COLUMN payment_provider TYPE text
  USING payment_provider::text;
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_provider_check
  CHECK (payment_provider IN ('stripe', 'vipps'));

-- 4. Convert data_requests.request_type back to TEXT (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_requests') THEN
    EXECUTE 'ALTER TABLE data_requests ALTER COLUMN request_type TYPE text USING request_type::text';
    EXECUTE 'ALTER TABLE data_requests ADD CONSTRAINT data_requests_request_type_check CHECK (request_type IN (''export'', ''delete''))';
  END IF;
END $$;

-- 5. Convert data_requests.status back to TEXT (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_requests') THEN
    EXECUTE 'ALTER TABLE data_requests ALTER COLUMN status TYPE text USING status::text';
    EXECUTE 'ALTER TABLE data_requests ALTER COLUMN status SET DEFAULT ''pending''';
    EXECUTE 'ALTER TABLE data_requests ADD CONSTRAINT data_requests_status_check CHECK (status IN (''pending'', ''verified'', ''processing'', ''completed'', ''failed''))';
  END IF;
END $$;

-- 6. Drop ENUM types
DROP TYPE IF EXISTS product_type_enum CASCADE;
DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS payment_provider_enum CASCADE;
DROP TYPE IF EXISTS data_request_type_enum CASCADE;
DROP TYPE IF EXISTS data_request_status_enum CASCADE;
