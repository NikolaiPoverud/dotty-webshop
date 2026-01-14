-- SEC-011: Schedule cleanup_expired_reservations() to run periodically
--
-- This migration schedules the cleanup_expired_reservations() function
-- to run every 5 minutes using pg_cron (if available).
--
-- If pg_cron is not available on your Supabase plan, use one of these alternatives:
-- 1. Vercel Cron: Create /api/cron/cleanup-reservations endpoint + vercel.json config
-- 2. Supabase Edge Function with a cron trigger
-- 3. External cron service calling the API endpoint

-- Enable pg_cron extension (available on Pro plan)
-- This will fail gracefully on free tier where pg_cron is not available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- pg_cron is already enabled
    NULL;
  ELSE
    -- Try to enable pg_cron (requires superuser on Pro plan)
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron extension not available. Use alternative cron method.';
    END;
  END IF;
END $$;

-- Schedule the cleanup job if pg_cron is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove any existing job with this name
    PERFORM cron.unschedule('cleanup-expired-reservations');

    -- Schedule to run every 5 minutes
    PERFORM cron.schedule(
      'cleanup-expired-reservations',
      '*/5 * * * *',  -- Every 5 minutes
      'SELECT cleanup_expired_reservations()'
    );

    RAISE NOTICE 'Scheduled cleanup_expired_reservations() to run every 5 minutes';
  ELSE
    RAISE NOTICE 'pg_cron not available - create alternative cron job';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to schedule cron job: %. Use alternative method.', SQLERRM;
END $$;

-- Document the cron requirement
COMMENT ON FUNCTION cleanup_expired_reservations() IS
  'Releases cart reservations older than 15 minutes. '
  'Should be called every 5 minutes via pg_cron, Edge Function, or external cron.';
