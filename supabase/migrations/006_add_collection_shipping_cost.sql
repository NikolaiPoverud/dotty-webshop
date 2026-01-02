-- Add shipping cost to collections
-- Shipping cost in NOK øre (same as prices)

alter table collections
add column shipping_cost integer default 0;

-- Add comment for documentation
comment on column collections.shipping_cost is 'Shipping cost in NOK øre (100 = 1 kr). 0 = free shipping.';

-- Common shipping cost presets for reference:
-- 0 = Free shipping
-- 9900 = 99 kr (small items)
-- 14900 = 149 kr (medium items)
-- 19900 = 199 kr (large items)
-- 29900 = 299 kr (oversized items)
