-- DB-001: Create missing table definitions
-- These tables may already exist in production (created via dashboard)
-- Using CREATE TABLE IF NOT EXISTS to handle both cases safely

-- ========================================================================
-- TESTIMONIALS - Customer feedback displayed on the site
-- ========================================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback text NOT NULL,
  name text NOT NULL,
  source text, -- e.g., "Instagram", "Email", "In Store"
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Updated at trigger for testimonials
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS testimonials_updated_at ON testimonials;
CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

-- ========================================================================
-- CONTACT_SUBMISSIONS - Messages from the contact form
-- ========================================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index for unread messages (admin workflow)
CREATE INDEX IF NOT EXISTS idx_contact_unread ON contact_submissions(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at DESC);

-- ========================================================================
-- AUDIT_LOG - Track all sensitive operations for GDPR compliance
-- ========================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  actor_type text NOT NULL CHECK (actor_type IN ('admin', 'customer', 'system')),
  actor_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ========================================================================
-- DATA_REQUESTS - GDPR data export/deletion requests
-- ========================================================================
CREATE TABLE IF NOT EXISTS data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('export', 'delete')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'processing', 'completed', 'failed')),
  verification_token uuid DEFAULT gen_random_uuid(),
  verified_at timestamptz,
  completed_at timestamptz,
  result_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for data requests
CREATE INDEX IF NOT EXISTS idx_data_requests_email ON data_requests(email);
CREATE INDEX IF NOT EXISTS idx_data_requests_token ON data_requests(verification_token);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_requests_created ON data_requests(created_at DESC);

-- ========================================================================
-- COOKIE_CONSENTS - Track user cookie consent for GDPR
-- ========================================================================
CREATE TABLE IF NOT EXISTS cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  consent_given boolean NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_cookie_session ON cookie_consents(session_id);
CREATE INDEX IF NOT EXISTS idx_cookie_created ON cookie_consents(created_at DESC);

-- ========================================================================
-- Add newsletter_subscribers columns for GDPR compliance (if not exists)
-- ========================================================================
-- These may already exist, using DO block for safety
DO $$
BEGIN
  -- Add confirmation columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_subscribers'
                 AND column_name = 'is_confirmed') THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN is_confirmed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_subscribers'
                 AND column_name = 'confirmation_token') THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN confirmation_token uuid DEFAULT gen_random_uuid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_subscribers'
                 AND column_name = 'confirmed_at') THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN confirmed_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_subscribers'
                 AND column_name = 'unsubscribed_at') THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribed_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_subscribers'
                 AND column_name = 'unsubscribe_token') THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_token uuid DEFAULT gen_random_uuid();
  END IF;

  -- Rename old column if exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'newsletter_subscribers'
             AND column_name = 'subscribed_at') THEN
    ALTER TABLE newsletter_subscribers RENAME COLUMN subscribed_at TO created_at;
  END IF;
END $$;

-- Index for newsletter token lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmation ON newsletter_subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribe ON newsletter_subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed ON newsletter_subscribers(is_confirmed) WHERE is_confirmed = true;

-- ========================================================================
-- Add order columns for GDPR compliance (if not exists)
-- ========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders'
                 AND column_name = 'privacy_accepted_at') THEN
    ALTER TABLE orders ADD COLUMN privacy_accepted_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders'
                 AND column_name = 'newsletter_opted_in') THEN
    ALTER TABLE orders ADD COLUMN newsletter_opted_in boolean DEFAULT false;
  END IF;

  -- Add cancelled status if not already in check constraint
  -- This requires recreating the constraint
END $$;

-- Update orders status constraint to include 'cancelled'
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'orders_status_check'
             AND table_name = 'orders') THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint with cancelled status
ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled'));

COMMENT ON TABLE testimonials IS 'Customer testimonials and feedback for display on the website';
COMMENT ON TABLE contact_submissions IS 'Contact form submissions from website visitors';
COMMENT ON TABLE audit_log IS 'Audit trail for GDPR compliance and security monitoring';
COMMENT ON TABLE data_requests IS 'GDPR data export and deletion requests';
COMMENT ON TABLE cookie_consents IS 'Cookie consent records for GDPR compliance';
