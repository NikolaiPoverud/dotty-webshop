-- DB-010: Add email format validation constraints
-- Uses a basic regex pattern that validates most common email formats
-- Pattern: allows letters, numbers, dots, hyphens, underscores, plus signs in local part
-- Domain requires at least one dot and 2-10 char TLD

-- Email validation pattern
-- This is intentionally permissive to avoid rejecting valid but unusual emails
-- while still catching obvious typos and invalid formats
CREATE OR REPLACE FUNCTION is_valid_email(email text)
RETURNS boolean AS $$
BEGIN
  -- Basic email validation: local@domain.tld
  -- Allows: letters, numbers, ., -, _, + in local part
  -- Requires: @ symbol, domain with at least one dot, 2-10 char TLD
  RETURN email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,10}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_email(text) IS 'Validates basic email format using a permissive regex pattern';

-- Add CHECK constraint to orders table
-- Note: Allows 'anonymized@deleted.local' for GDPR-anonymized orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_email_format;
ALTER TABLE orders ADD CONSTRAINT orders_email_format
CHECK (
  customer_email = 'anonymized@deleted.local' OR
  is_valid_email(customer_email)
);

-- Add CHECK constraint to newsletter_subscribers table
ALTER TABLE newsletter_subscribers DROP CONSTRAINT IF EXISTS newsletter_email_format;
ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_email_format
CHECK (is_valid_email(email));

-- Add CHECK constraint to contact_submissions table
ALTER TABLE contact_submissions DROP CONSTRAINT IF EXISTS contact_email_format;
ALTER TABLE contact_submissions ADD CONSTRAINT contact_email_format
CHECK (is_valid_email(email));

-- Add CHECK constraint to data_requests table
ALTER TABLE data_requests DROP CONSTRAINT IF EXISTS data_requests_email_format;
ALTER TABLE data_requests ADD CONSTRAINT data_requests_email_format
CHECK (is_valid_email(email));

-- Add comments for documentation
COMMENT ON CONSTRAINT orders_email_format ON orders IS 'Validates customer email format (allows anonymized@deleted.local for GDPR)';
COMMENT ON CONSTRAINT newsletter_email_format ON newsletter_subscribers IS 'Validates subscriber email format';
COMMENT ON CONSTRAINT contact_email_format ON contact_submissions IS 'Validates contact email format';
COMMENT ON CONSTRAINT data_requests_email_format ON data_requests IS 'Validates GDPR request email format';
