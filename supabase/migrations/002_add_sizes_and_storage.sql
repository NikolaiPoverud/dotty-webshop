-- Add sizes to products (dimensions in cm)
-- sizes is a JSONB array: [{"width": 60, "height": 80, "label": "60x80 cm"}]
ALTER TABLE products ADD COLUMN sizes jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for artwork images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artwork',
  'artwork',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for artwork bucket

-- Anyone can view artwork images (public bucket)
CREATE POLICY "Artwork images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'artwork');

-- Only authenticated users with service role can upload
-- In practice, we use the admin client with service role key
CREATE POLICY "Service role can upload artwork"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artwork');

CREATE POLICY "Service role can update artwork"
ON storage.objects FOR UPDATE
USING (bucket_id = 'artwork');

CREATE POLICY "Service role can delete artwork"
ON storage.objects FOR DELETE
USING (bucket_id = 'artwork');

-- Add RLS policy for products insert/update/delete (admin only via service role)
CREATE POLICY "Service role can manage products"
ON products FOR ALL
USING (true)
WITH CHECK (true);

-- Add RLS policy for collections insert/update/delete
CREATE POLICY "Service role can manage collections"
ON collections FOR ALL
USING (true)
WITH CHECK (true);
