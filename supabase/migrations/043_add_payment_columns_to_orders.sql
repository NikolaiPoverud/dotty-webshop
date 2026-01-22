-- Add payment tracking columns to orders table
-- (Applied directly to production, saving migration for reference)

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_provider TEXT;

-- Add check constraint for valid payment statuses
ALTER TABLE orders
ADD CONSTRAINT payment_status_check CHECK (
  payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')
);

-- Add check constraint for valid payment providers
ALTER TABLE orders
ADD CONSTRAINT payment_provider_check CHECK (
  payment_provider IS NULL OR payment_provider IN ('stripe', 'vipps')
);

COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, refunded, cancelled';
COMMENT ON COLUMN orders.payment_provider IS 'Payment provider: stripe or vipps';
