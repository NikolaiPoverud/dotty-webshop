-- Migration: Fix email_queue security issues
-- Fixes: RLS disabled, function search_path mutable

-- ============================================
-- FIX 1: Enable RLS on email_queue table
-- This table is used internally by the system only
-- ============================================

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role (backend) should access this table
-- No policies needed - will only be accessed via service_role key

COMMENT ON TABLE email_queue IS 'Queue for asynchronous email delivery - service role access only';

-- ============================================
-- FIX 2: Fix is_valid_email function search_path
-- ============================================

CREATE OR REPLACE FUNCTION is_valid_email(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
END;
$$;

-- ============================================
-- FIX 3: Fix queue_email function search_path
-- ============================================

CREATE OR REPLACE FUNCTION queue_email(
  p_email_type text,
  p_recipient_email text,
  p_subject text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_priority integer DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO email_queue (
    email_type, recipient_email, subject,
    entity_type, entity_id, priority, metadata
  ) VALUES (
    p_email_type, p_recipient_email, p_subject,
    p_entity_type, p_entity_id, p_priority, p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION queue_email IS 'Adds an email to the processing queue';

-- ============================================
-- FIX 4: Fix get_pending_emails function search_path
-- ============================================

CREATE OR REPLACE FUNCTION get_pending_emails(
  p_batch_size integer DEFAULT 10
)
RETURNS SETOF email_queue
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE email_queue
  SET status = 'processing', attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM email_queue
    WHERE status = 'pending'
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
      AND attempts < max_attempts
    ORDER BY priority DESC, created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

COMMENT ON FUNCTION get_pending_emails IS 'Gets and locks batch of pending emails for processing';

-- ============================================
-- FIX 5: Fix mark_email_sent function search_path
-- ============================================

CREATE OR REPLACE FUNCTION mark_email_sent(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE email_queue
  SET status = 'sent', processed_at = now()
  WHERE id = p_id;
END;
$$;

COMMENT ON FUNCTION mark_email_sent IS 'Marks an email as successfully sent';

-- ============================================
-- FIX 6: Fix mark_email_failed function search_path
-- ============================================

CREATE OR REPLACE FUNCTION mark_email_failed(
  p_id uuid,
  p_error text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_attempts integer;
  v_max_attempts integer;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
  FROM email_queue WHERE id = p_id;

  IF v_attempts >= v_max_attempts THEN
    -- Max retries reached, mark as permanently failed
    UPDATE email_queue
    SET status = 'failed', last_error = p_error, processed_at = now()
    WHERE id = p_id;
  ELSE
    -- Schedule retry with exponential backoff: 1min, 5min, 30min
    UPDATE email_queue
    SET
      status = 'pending',
      last_error = p_error,
      next_attempt_at = now() + (power(5, v_attempts) || ' minutes')::interval
    WHERE id = p_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION mark_email_failed IS 'Marks email as failed with exponential backoff retry';

-- ============================================
-- FIX 7: Fix cleanup_email_queue function search_path
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_email_queue(
  p_days_to_keep integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM email_queue
  WHERE status IN ('sent', 'failed', 'cancelled')
    AND processed_at < now() - (p_days_to_keep || ' days')::interval;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION cleanup_email_queue IS 'Removes processed emails older than specified days';
