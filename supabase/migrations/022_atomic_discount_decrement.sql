-- SEC-006: Fix discount code race condition with atomic database function
-- The previous implementation had a read-then-update race condition
-- This function uses a single atomic UPDATE to prevent multiple uses

CREATE OR REPLACE FUNCTION decrement_discount_code(p_code text)
RETURNS jsonb AS $$
DECLARE
  v_code text;
  v_remaining integer;
  v_result jsonb;
BEGIN
  v_code := UPPER(p_code);

  -- Atomic decrement with row-level lock
  -- Only decrements if uses_remaining > 0
  UPDATE discount_codes
  SET uses_remaining = uses_remaining - 1
  WHERE code = v_code
    AND is_active = true
    AND uses_remaining IS NOT NULL
    AND uses_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING uses_remaining INTO v_remaining;

  IF NOT FOUND THEN
    -- Check why it failed
    PERFORM 1 FROM discount_codes WHERE code = v_code;
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Discount code not found'
      );
    END IF;

    PERFORM 1 FROM discount_codes
    WHERE code = v_code AND is_active = false;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Discount code is not active'
      );
    END IF;

    PERFORM 1 FROM discount_codes
    WHERE code = v_code AND expires_at IS NOT NULL AND expires_at <= NOW();
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Discount code has expired'
      );
    END IF;

    -- Must be out of uses
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Discount code has no remaining uses'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'remaining', v_remaining
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION decrement_discount_code TO service_role;

COMMENT ON FUNCTION decrement_discount_code IS
  'Atomically decrements discount code uses_remaining. Returns success status and remaining uses.';
