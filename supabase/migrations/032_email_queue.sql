-- ARCH-010: Email queue for async email sending
-- Allows emails to be queued and processed asynchronously by a cron job
-- This prevents webhook timeouts and provides retry capability

-- ============================================================================
-- Email Queue Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email details
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,

  -- Related entity (for fetching fresh data)
  entity_type text,           -- 'order', 'newsletter', etc.
  entity_id uuid,             -- ID of the related entity

  -- Queue metadata
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  priority integer NOT NULL DEFAULT 0,  -- Higher = processed first

  -- Retry handling
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  next_attempt_at timestamptz DEFAULT now(),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,

  -- Additional context
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_pending
ON email_queue(next_attempt_at, priority DESC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_entity
ON email_queue(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_status
ON email_queue(status);

CREATE INDEX IF NOT EXISTS idx_email_queue_created
ON email_queue(created_at DESC);

-- Email format validation
ALTER TABLE email_queue ADD CONSTRAINT email_queue_recipient_format
CHECK (is_valid_email(recipient_email));

COMMENT ON TABLE email_queue IS 'Queue for asynchronous email delivery with retry support';

-- ============================================================================
-- Queue Management Functions
-- ============================================================================

-- Add email to queue
CREATE OR REPLACE FUNCTION queue_email(
  p_email_type text,
  p_recipient_email text,
  p_subject text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_priority integer DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION queue_email IS 'Adds an email to the processing queue';

-- Get next batch of emails to process
CREATE OR REPLACE FUNCTION get_pending_emails(
  p_batch_size integer DEFAULT 10
)
RETURNS SETOF email_queue AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_emails IS 'Gets and locks batch of pending emails for processing';

-- Mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(p_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE email_queue
  SET status = 'sent', processed_at = now()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Mark email as failed and schedule retry
CREATE OR REPLACE FUNCTION mark_email_failed(
  p_id uuid,
  p_error text
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_email_failed IS 'Marks email as failed with exponential backoff retry';

-- Queue cleanup: Remove old sent/failed emails
CREATE OR REPLACE FUNCTION cleanup_email_queue(
  p_days_to_keep integer DEFAULT 30
)
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM email_queue
  WHERE status IN ('sent', 'failed', 'cancelled')
    AND processed_at < now() - (p_days_to_keep || ' days')::interval;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_email_queue IS 'Removes processed emails older than specified days';

-- ============================================================================
-- Usage Documentation
-- ============================================================================

/*
USAGE EXAMPLES:

1. Queue an order confirmation email:
   SELECT queue_email(
     'order_confirmation',
     'customer@example.com',
     'Ordrebekreftelse #12345',
     'order',
     'uuid-of-order'::uuid,
     10  -- High priority
   );

2. Get pending emails for processing:
   SELECT * FROM get_pending_emails(5);

3. Mark email as sent:
   SELECT mark_email_sent('uuid-of-email'::uuid);

4. Mark email as failed (will retry):
   SELECT mark_email_failed('uuid-of-email'::uuid, 'Connection timeout');

5. Cleanup old processed emails:
   SELECT cleanup_email_queue(30);

EMAIL TYPES:
- order_confirmation
- new_order_alert
- shipping_notification
- delivery_confirmation
- newsletter
- gdpr_export
- password_reset
*/
