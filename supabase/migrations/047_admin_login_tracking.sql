-- SEC-MFA: Admin login tracking and last login
-- This migration adds tables for tracking admin login attempts and last login times

-- ========================================================================
-- ADMIN_LOGIN_ATTEMPTS - Track all login attempts for security monitoring
-- ========================================================================
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  success boolean NOT NULL,
  ip_address text,
  user_agent text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for admin login attempts
CREATE INDEX IF NOT EXISTS idx_admin_login_email ON admin_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_admin_login_ip ON admin_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_login_created ON admin_login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_failed ON admin_login_attempts(email, created_at DESC) WHERE success = false;

-- Enable RLS on admin_login_attempts
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- No public access - only service role
-- Admin users can view via admin API routes

-- ========================================================================
-- ADMIN_PROFILES - Extended profile data for admin users
-- ========================================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_login_at timestamptz,
  last_login_ip text,
  login_count integer DEFAULT 0,
  mfa_enabled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_profiles
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admin users can view their own profile
CREATE POLICY "Users can view own admin profile"
  ON admin_profiles FOR SELECT
  USING (auth.uid() = id);

-- No direct updates - use service role via API

-- ========================================================================
-- Function to update last login
-- ========================================================================
CREATE OR REPLACE FUNCTION update_admin_last_login(
  user_id uuid,
  login_ip text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_profiles (id, last_login_at, last_login_ip, login_count)
  VALUES (user_id, now(), login_ip, 1)
  ON CONFLICT (id) DO UPDATE
  SET
    last_login_at = now(),
    last_login_ip = COALESCE(login_ip, admin_profiles.last_login_ip),
    login_count = admin_profiles.login_count + 1,
    updated_at = now();
END;
$$;

-- ========================================================================
-- Function to log login attempt
-- ========================================================================
CREATE OR REPLACE FUNCTION log_admin_login_attempt(
  attempt_email text,
  attempt_success boolean,
  attempt_ip text DEFAULT NULL,
  attempt_user_agent text DEFAULT NULL,
  attempt_error text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_id uuid;
BEGIN
  INSERT INTO admin_login_attempts (email, success, ip_address, user_agent, error_message)
  VALUES (attempt_email, attempt_success, attempt_ip, attempt_user_agent, attempt_error)
  RETURNING id INTO attempt_id;

  RETURN attempt_id;
END;
$$;

-- ========================================================================
-- Retention policy - delete login attempts older than 90 days
-- ========================================================================
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM admin_login_attempts
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- Schedule cleanup (requires pg_cron extension, if available)
-- This is optional and depends on your Supabase plan
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule daily cleanup at 3 AM
    PERFORM cron.schedule(
      'cleanup-admin-login-attempts',
      '0 3 * * *',
      'SELECT cleanup_old_login_attempts()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available, cleanup will need to be run manually
  NULL;
END;
$$;

-- Comments
COMMENT ON TABLE admin_login_attempts IS 'Tracks all admin login attempts for security monitoring';
COMMENT ON TABLE admin_profiles IS 'Extended profile data for admin users including last login tracking';
COMMENT ON FUNCTION update_admin_last_login IS 'Updates the last login timestamp for an admin user';
COMMENT ON FUNCTION log_admin_login_attempt IS 'Logs an admin login attempt (successful or failed)';
