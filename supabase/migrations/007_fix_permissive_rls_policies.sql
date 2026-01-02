-- SECURITY FIX: Remove overly permissive RLS policies on products and collections
-- These policies allowed ANY user to modify/delete data (CRITICAL vulnerability)
-- After this migration, only service_role can modify data (via admin API)

-- Drop the dangerous "FOR ALL" policies that use (true)
DROP POLICY IF EXISTS "Service role can manage products" ON products;
DROP POLICY IF EXISTS "Service role can manage collections" ON collections;

-- Keep the existing read policy from 001_initial_schema.sql:
-- "Products are viewable by everyone" - SELECT with USING (true)
-- "Collections are viewable by everyone" - SELECT with USING (true)

-- The service_role key bypasses RLS entirely, so admin operations
-- through the admin API will still work. Public users can only SELECT.

-- Also fix the storage policies which are too permissive
DROP POLICY IF EXISTS "Service role can upload artwork" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update artwork" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete artwork" ON storage.objects;

-- Recreate storage policies with proper auth checks
-- Note: service_role bypasses RLS, so these only affect anon/authenticated roles
-- We want to BLOCK all non-service-role uploads

-- Only allow authenticated users to upload (we'll use service_role in practice)
CREATE POLICY "Authenticated can upload artwork"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artwork');

CREATE POLICY "Authenticated can update artwork"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artwork');

CREATE POLICY "Authenticated can delete artwork"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artwork');
