-- SEC-007: Enable RLS on sensitive tables
-- These tables contain personal data and should only be accessed via service_role

-- Enable RLS on audit_log (admin only)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contact_submissions (admin only)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on data_requests (admin only)
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cookie_consents (no public access needed)
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on testimonials (public read, admin write)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create read policy for testimonials (public can read active ones)
CREATE POLICY "Public can read active testimonials"
ON testimonials FOR SELECT
USING (is_active = true);

-- Note: All write operations on these tables go through admin API
-- which uses service_role key (bypasses RLS), so no INSERT/UPDATE/DELETE
-- policies are needed for these tables.
