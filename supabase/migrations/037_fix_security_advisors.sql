-- Migration: Fix security advisor warnings and errors
-- Fixes: SECURITY DEFINER views, function search_path, duplicate policies

-- ============================================
-- FIX 1: Recreate views without SECURITY DEFINER
-- ============================================

DROP VIEW IF EXISTS active_products;
CREATE VIEW active_products
WITH (security_invoker = true)
AS
SELECT *
FROM products
WHERE deleted_at IS NULL
  AND is_public = true;

DROP VIEW IF EXISTS active_collections;
CREATE VIEW active_collections
WITH (security_invoker = true)
AS
SELECT *
FROM collections
WHERE deleted_at IS NULL
  AND is_public = true;

-- ============================================
-- FIX 2: Fix function search_path
-- ============================================

-- Drop trigger first, then function, then recreate both
DROP TRIGGER IF EXISTS set_order_number ON orders;
DROP FUNCTION IF EXISTS generate_order_number();

CREATE FUNCTION generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'DOT-' || nextval('order_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- ============================================
-- FIX 3: Remove duplicate testimonials SELECT policies
-- ============================================

DROP POLICY IF EXISTS "Public can read active testimonials" ON testimonials;

-- ============================================
-- FIX 4: Add basic RLS policy for orders table
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;
CREATE POLICY "Authenticated users can manage orders"
ON orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders"
ON orders
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Orders viewable by payment session" ON orders;
CREATE POLICY "Orders viewable by payment session"
ON orders
FOR SELECT
TO anon
USING (payment_session_id IS NOT NULL);
