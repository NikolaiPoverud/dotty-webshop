-- DB-011: Add phone format validation constraints
-- Validates Norwegian phone numbers (8 digits) with optional +47 country code
-- Also allows common international formats

-- Phone validation function
-- Accepts:
--   - Norwegian: 12345678, +4712345678, +47 12345678, 47 12 34 56 78
--   - International: +XX XXXXXXXXX (where X is digits, allows spaces/dashes)
--   - Special: 00000000 (for anonymized records)
CREATE OR REPLACE FUNCTION is_valid_phone(phone text)
RETURNS boolean AS $$
DECLARE
  -- Remove common separators (spaces, dashes, parentheses, dots)
  cleaned_phone text := regexp_replace(phone, '[\s\-\(\)\.]', '', 'g');
BEGIN
  -- Allow anonymized placeholder
  IF cleaned_phone = '00000000' THEN
    RETURN true;
  END IF;

  -- Norwegian format without country code: exactly 8 digits
  IF cleaned_phone ~ '^\d{8}$' THEN
    RETURN true;
  END IF;

  -- Norwegian format with country code: +47 followed by 8 digits
  IF cleaned_phone ~ '^\+47\d{8}$' THEN
    RETURN true;
  END IF;

  -- Norwegian format with country code (no plus): 47 followed by 8 digits
  IF cleaned_phone ~ '^47\d{8}$' THEN
    RETURN true;
  END IF;

  -- International format: + followed by 7-15 digits (ITU-T E.164 standard)
  IF cleaned_phone ~ '^\+\d{7,15}$' THEN
    RETURN true;
  END IF;

  -- Alternative international without plus: 00 followed by country code and number
  IF cleaned_phone ~ '^00\d{8,14}$' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_phone(text) IS 'Validates phone number format (Norwegian 8 digits or international E.164)';

-- Add CHECK constraint to orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_phone_format;
ALTER TABLE orders ADD CONSTRAINT orders_phone_format
CHECK (is_valid_phone(customer_phone));

-- Add comments for documentation
COMMENT ON CONSTRAINT orders_phone_format ON orders IS 'Validates customer phone format (Norwegian 8 digits or international)';
