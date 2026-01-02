-- Add type and product reference fields to contact_submissions
ALTER TABLE contact_submissions
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'contact',
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS product_title TEXT;

-- Add index for filtering by type
CREATE INDEX IF NOT EXISTS idx_contact_submissions_type ON contact_submissions(type);

-- Comment on new columns
COMMENT ON COLUMN contact_submissions.type IS 'Type of submission: contact, product_inquiry, sold_out_inquiry';
COMMENT ON COLUMN contact_submissions.product_id IS 'Reference to product for product-related inquiries';
COMMENT ON COLUMN contact_submissions.product_title IS 'Product title snapshot at time of inquiry';
