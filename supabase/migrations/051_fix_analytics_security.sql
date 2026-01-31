-- Fix security advisors for analytics

-- Fix analytics_daily_stats view - use security_invoker
DROP VIEW IF EXISTS analytics_daily_stats;
CREATE VIEW analytics_daily_stats
WITH (security_invoker = true)
AS
SELECT
  date_trunc('day', created_at)::date as date,
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE created_at > now() - interval '30 days'
GROUP BY date_trunc('day', created_at)::date, event_type
ORDER BY date DESC, event_type;

-- Fix analytics_popular_products view - use security_invoker
DROP VIEW IF EXISTS analytics_popular_products;
CREATE VIEW analytics_popular_products
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.image_url,
  COUNT(*) FILTER (WHERE ae.event_type = 'product_view') as views,
  COUNT(*) FILTER (WHERE ae.event_type = 'add_to_cart') as cart_adds,
  COUNT(*) FILTER (WHERE ae.event_type = 'purchase') as purchases
FROM products p
LEFT JOIN analytics_events ae ON ae.product_id = p.id
  AND ae.created_at > now() - interval '30 days'
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.slug, p.image_url
ORDER BY views DESC NULLS LAST;

-- Fix cleanup function - add search_path
DROP FUNCTION IF EXISTS cleanup_old_analytics_events();
CREATE FUNCTION cleanup_old_analytics_events()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- Simplify analytics RLS - service role for admin reads
DROP POLICY IF EXISTS "Admins can read analytics events" ON analytics_events;
CREATE POLICY "Service role can read analytics"
  ON analytics_events FOR SELECT
  TO service_role
  USING (true);
