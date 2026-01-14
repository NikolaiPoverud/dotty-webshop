-- DB-013: Add audit log retention policy
-- Archives audit logs older than 2 years to a separate table
-- and deletes logs older than 7 years (GDPR compliance)

-- ============================================================================
-- Archive Table
-- ============================================================================

-- Create archive table with same structure as audit_log
CREATE TABLE IF NOT EXISTS audit_log_archive (
  id uuid PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  actor_type text NOT NULL,
  actor_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  referer text,
  created_at timestamptz NOT NULL,
  archived_at timestamptz DEFAULT now()
);

-- Index for querying archived logs
CREATE INDEX IF NOT EXISTS idx_audit_archive_created ON audit_log_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_archive_action ON audit_log_archive(action);
CREATE INDEX IF NOT EXISTS idx_audit_archive_entity ON audit_log_archive(entity_type, entity_id);

COMMENT ON TABLE audit_log_archive IS 'Archived audit logs older than 2 years (retained for GDPR compliance up to 7 years)';

-- ============================================================================
-- Retention Functions
-- ============================================================================

-- Archive audit logs older than specified days
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
  archive_after_days integer DEFAULT 730  -- 2 years
)
RETURNS integer AS $$
DECLARE
  archived_count integer;
  cutoff_date timestamptz := now() - (archive_after_days || ' days')::interval;
BEGIN
  -- Move old logs to archive table
  WITH moved AS (
    DELETE FROM audit_log
    WHERE created_at < cutoff_date
    RETURNING *
  )
  INSERT INTO audit_log_archive (
    id, action, entity_type, entity_id, actor_type, actor_id,
    details, ip_address, user_agent, referer, created_at
  )
  SELECT
    id, action, entity_type, entity_id, actor_type, actor_id,
    details, ip_address, user_agent, referer, created_at
  FROM moved;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_audit_logs(integer) IS 'Archives audit logs older than specified days (default 2 years)';

-- Delete archived logs older than specified days (for GDPR compliance)
CREATE OR REPLACE FUNCTION delete_old_archived_logs(
  delete_after_days integer DEFAULT 2555  -- 7 years
)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
  cutoff_date timestamptz := now() - (delete_after_days || ' days')::interval;
BEGIN
  DELETE FROM audit_log_archive
  WHERE created_at < cutoff_date;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_old_archived_logs(integer) IS 'Deletes archived audit logs older than specified days (default 7 years for GDPR)';

-- Combined maintenance function
CREATE OR REPLACE FUNCTION maintain_audit_logs()
RETURNS jsonb AS $$
DECLARE
  archived integer;
  deleted integer;
BEGIN
  -- Archive logs older than 2 years
  SELECT archive_old_audit_logs(730) INTO archived;

  -- Delete archived logs older than 7 years
  SELECT delete_old_archived_logs(2555) INTO deleted;

  RETURN jsonb_build_object(
    'archived', archived,
    'deleted', deleted,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintain_audit_logs() IS 'Performs complete audit log maintenance: archives 2+ year old logs, deletes 7+ year old archives';

-- ============================================================================
-- Documentation
-- ============================================================================

/*
USAGE:

1. Manual execution (one-time or ad-hoc):
   SELECT maintain_audit_logs();

2. Via Vercel Cron (recommended):
   Add to vercel.json crons array:
   {
     "path": "/api/cron/audit-maintenance",
     "schedule": "0 3 1 * *"  -- Monthly at 3 AM on the 1st
   }

3. Via Supabase pg_cron (if available):
   SELECT cron.schedule('audit-log-maintenance', '0 3 1 * *', 'SELECT maintain_audit_logs()');

4. Query archived logs:
   SELECT * FROM audit_log_archive WHERE action = 'order_update' ORDER BY created_at DESC;

RETENTION POLICY:
- Active logs: Last 2 years (in audit_log table)
- Archived logs: 2-7 years (in audit_log_archive table)
- Deleted: After 7 years (GDPR compliance)
*/
