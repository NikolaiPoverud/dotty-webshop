/**
 * Checkout Token - SEC-002 Fix
 *
 * Generates and validates cryptographically signed checkout tokens
 * to ensure payment initiation requests originated from a legitimate
 * checkout session in this application.
 *
 * Token format: timestamp.signature
 * - timestamp: Unix timestamp in milliseconds when token was created
 * - signature: HMAC-SHA256 of timestamp using CHECKOUT_TOKEN_SECRET
 */

import { createHmac } from 'crypto';

// SEC-010: Require dedicated CHECKOUT_TOKEN_SECRET in production
// Using SUPABASE_SERVICE_ROLE_KEY as fallback is a security risk
const TOKEN_SECRET = process.env.CHECKOUT_TOKEN_SECRET;
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function getTokenSecret(): string {
  if (!TOKEN_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SEC-010: CHECKOUT_TOKEN_SECRET environment variable is required in production. ' +
        'Generate a secure random string (32+ chars) and set it as CHECKOUT_TOKEN_SECRET.'
      );
    }
    // Allow fallback only in development for convenience
    console.warn(
      'SEC-010 WARNING: CHECKOUT_TOKEN_SECRET not set. Using development fallback. ' +
      'Set CHECKOUT_TOKEN_SECRET before deploying to production!'
    );
    return 'dev-only-insecure-fallback-token-secret-12345';
  }
  return TOKEN_SECRET;
}

interface TokenValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Generate a checkout token for client-side use
 * Called when the checkout page loads
 */
export function generateCheckoutToken(): string {
  const secret = getTokenSecret();
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', secret)
    .update(timestamp)
    .digest('hex');

  return `${timestamp}.${signature}`;
}

/**
 * Validate a checkout token
 * Returns validation result with error message if invalid
 */
export function validateCheckoutToken(token: string | null | undefined): TokenValidationResult {
  if (!token) {
    return { valid: false, error: 'Missing checkout token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [timestamp, signature] = parts;

  // Validate timestamp is a number
  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid token timestamp' };
  }

  // Check token expiry
  const age = Date.now() - timestampNum;
  if (age > TOKEN_EXPIRY_MS) {
    return { valid: false, error: 'Checkout session expired. Please refresh the page.' };
  }

  // Don't accept tokens from the future (clock skew tolerance: 1 minute)
  if (age < -60000) {
    return { valid: false, error: 'Invalid token timestamp' };
  }

  // Validate signature
  const secret = getTokenSecret();
  const expectedSignature = createHmac('sha256', secret)
    .update(timestamp)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(signature, expectedSignature)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  return { valid: true };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
