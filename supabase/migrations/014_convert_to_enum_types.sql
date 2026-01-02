-- DB-013: Convert TEXT columns with CHECK constraints to PostgreSQL ENUM types
-- ENUMs provide better type safety, performance, and self-documentation

-- 1. Create ENUM types
CREATE TYPE product_type_enum AS ENUM ('original', 'print');
CREATE TYPE order_status_enum AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_provider_enum AS ENUM ('stripe', 'vipps');
CREATE TYPE data_request_type_enum AS ENUM ('export', 'delete');
CREATE TYPE data_request_status_enum AS ENUM ('pending', 'verified', 'processing', 'completed', 'failed');

-- 2. Convert products.product_type
-- First drop the check constraint, then alter column type
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products
  ALTER COLUMN product_type TYPE product_type_enum
  USING product_type::product_type_enum;
ALTER TABLE products ALTER COLUMN product_type SET DEFAULT 'original'::product_type_enum;

-- 3. Convert orders.status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
  ALTER COLUMN status TYPE order_status_enum
  USING status::order_status_enum;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::order_status_enum;

-- 4. Convert orders.payment_provider
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_provider_check;
ALTER TABLE orders
  ALTER COLUMN payment_provider TYPE payment_provider_enum
  USING payment_provider::payment_provider_enum;

-- 5. Convert data_requests.request_type (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_requests') THEN
    ALTER TABLE data_requests DROP CONSTRAINT IF EXISTS data_requests_request_type_check;
    EXECUTE 'ALTER TABLE data_requests ALTER COLUMN request_type TYPE data_request_type_enum USING request_type::data_request_type_enum';
  END IF;
END $$;

-- 6. Convert data_requests.status (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_requests') THEN
    ALTER TABLE data_requests DROP CONSTRAINT IF EXISTS data_requests_status_check;
    EXECUTE 'ALTER TABLE data_requests ALTER COLUMN status TYPE data_request_status_enum USING status::data_request_status_enum';
    EXECUTE 'ALTER TABLE data_requests ALTER COLUMN status SET DEFAULT ''pending''::data_request_status_enum';
  END IF;
END $$;

-- Add comment explaining the types
COMMENT ON TYPE product_type_enum IS 'Type of product: original artwork or print';
COMMENT ON TYPE order_status_enum IS 'Order lifecycle status';
COMMENT ON TYPE payment_provider_enum IS 'Payment provider used for transaction';
COMMENT ON TYPE data_request_type_enum IS 'Type of GDPR data request';
COMMENT ON TYPE data_request_status_enum IS 'Status of GDPR data request';
