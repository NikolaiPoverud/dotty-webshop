-- Fix payment_status check constraint to include all valid values
-- The Vipps callback stores 'authorized' and error handler stores 'pending_verification'
-- which weren't in the original constraint

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS payment_status_check;

-- Add updated constraint with all valid values
ALTER TABLE orders
ADD CONSTRAINT payment_status_check CHECK (
  payment_status IS NULL OR payment_status IN (
    'pending',
    'authorized',
    'pending_verification',
    'paid',
    'failed',
    'refunded',
    'cancelled'
  )
);

COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, authorized, pending_verification, paid, failed, refunded, cancelled';
