-- Create the VELKOMST10 welcome discount code for newsletter signups
INSERT INTO discount_codes (code, discount_percent, is_active, uses_remaining)
VALUES ('VELKOMST10', 10, true, null)
ON CONFLICT (code) DO NOTHING;
