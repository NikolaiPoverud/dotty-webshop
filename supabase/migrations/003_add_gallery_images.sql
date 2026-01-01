-- Add gallery_images to products (array of image URLs)
-- gallery_images is a JSONB array: [{"url": "...", "path": "..."}]
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb;
