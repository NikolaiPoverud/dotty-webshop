-- Update constraint to allow free_shipping-only discounts
ALTER TABLE discount_codes DROP CONSTRAINT IF EXISTS discount_type_check;

ALTER TABLE discount_codes ADD CONSTRAINT discount_type_check CHECK (
  -- Must have at least one discount type
  (discount_percent IS NOT NULL) OR
  (discount_amount IS NOT NULL) OR
  (free_shipping = true)
);