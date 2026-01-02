-- DB-008: Add order total CHECK constraint
-- Ensures order total equals subtotal minus discount

ALTER TABLE orders
ADD CONSTRAINT orders_total_check
CHECK (total = subtotal - discount_amount);
