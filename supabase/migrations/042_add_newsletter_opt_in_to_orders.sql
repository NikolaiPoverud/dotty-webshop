-- Add newsletter_opt_in and privacy_accepted columns to orders table
-- These track customer consent during checkout

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN orders.newsletter_opt_in IS 'Customer opted in to newsletter during checkout';
COMMENT ON COLUMN orders.privacy_accepted IS 'Customer accepted privacy policy during checkout';
