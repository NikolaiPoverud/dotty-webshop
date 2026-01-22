-- Migration: Add free shipping option to discount codes
-- Allows discount codes to grant free shipping

ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN discount_codes.free_shipping IS 'When true, this discount code grants free shipping';

-- Add index for efficient lookup of free shipping codes
CREATE INDEX IF NOT EXISTS idx_discount_codes_free_shipping
ON discount_codes(free_shipping)
WHERE free_shipping = true AND is_active = true AND deleted_at IS NULL;
