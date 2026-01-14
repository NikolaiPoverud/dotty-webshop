-- SEC-005: Remove permissive INSERT policy on newsletter_subscribers
--
-- The original policy allowed anyone to insert into newsletter_subscribers,
-- which could be exploited for email bombing attacks.
--
-- All newsletter operations should now go through the API routes which use
-- service_role for database access, ensuring rate limiting and validation.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;

-- Add a more restrictive comment for documentation
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscribers - INSERT/UPDATE/DELETE only via service_role (API routes)';
