-- Simple analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'product_view', 'add_to_cart', 'purchase')),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  page_path text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_product_id ON analytics_events(product_id) WHERE product_id IS NOT NULL;

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous tracking)
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      )
    )
  );

-- Auto-cleanup old events (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- View for daily stats (easier querying)
CREATE OR REPLACE VIEW analytics_daily_stats AS
SELECT
  date_trunc('day', created_at)::date as date,
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE created_at > now() - interval '30 days'
GROUP BY date_trunc('day', created_at)::date, event_type
ORDER BY date DESC, event_type;

-- View for popular products
CREATE OR REPLACE VIEW analytics_popular_products AS
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
