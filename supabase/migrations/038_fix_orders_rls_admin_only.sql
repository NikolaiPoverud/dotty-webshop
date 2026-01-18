-- Migration: SEC-002 Fix permissive Orders RLS policy
-- SECURITY FIX: Restrict order management to admin users only
--
-- Previous policy allowed ANY authenticated user to read/modify/delete ALL orders
-- New policy restricts order management to users with role='admin' in their metadata

-- ============================================
-- Drop the overly permissive policy
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;

-- ============================================
-- Create admin-only management policy
-- ============================================
-- Only users with role='admin' in their user_metadata can manage orders
CREATE POLICY "Admins can manage orders"
ON orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================
-- Allow customers to view their own orders
-- ============================================
-- Customers can view orders matching their email address
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
TO authenticated
USING (customer_email = auth.jwt()->>'email');

-- ============================================
-- Keep existing policies for anon users
-- ============================================
-- "Anyone can create orders" - needed for checkout flow
-- "Orders viewable by payment session" - needed for order confirmation page
-- These were already correctly scoped in migration 037

-- ============================================
-- Add index to support the admin check if not exists
-- ============================================
-- Note: We can't directly index raw_user_meta_data in auth.users
-- but the subquery is small enough that performance should be acceptable
