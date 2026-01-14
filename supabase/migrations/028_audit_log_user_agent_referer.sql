-- SEC-015: Add user_agent and referer columns to audit_log
-- These fields help with security analysis and identifying suspicious activity patterns

-- Add user_agent column (browser/client identifier)
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add referer column (referring URL)
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS referer TEXT;

-- Add index on user_agent for pattern analysis (e.g., finding bot activity)
CREATE INDEX IF NOT EXISTS idx_audit_user_agent ON audit_log(user_agent) WHERE user_agent IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN audit_log.user_agent IS 'Browser/client user agent string for security analysis';
COMMENT ON COLUMN audit_log.referer IS 'HTTP Referer header value for tracking request origin';
