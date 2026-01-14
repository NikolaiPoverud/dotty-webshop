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

const TOKEN_SECRET = process.env.CHECKOUT_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface TokenValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Generate a checkout token for client-side use
 * Called when the checkout page loads
 */
export function generateCheckoutToken(): string {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', TOKEN_SECRET)
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
  const expectedSignature = createHmac('sha256', TOKEN_SECRET)
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
