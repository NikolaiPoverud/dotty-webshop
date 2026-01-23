import { createHmac, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

const TOKEN_SECRET = process.env.CHECKOUT_TOKEN_SECRET;
const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

function getTokenSecret(): string {
  if (!TOKEN_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CHECKOUT_TOKEN_SECRET environment variable is required in production. ' +
          'Generate a secure random string (32+ chars) and set it as CHECKOUT_TOKEN_SECRET.'
      );
    }
    console.warn(
      'CHECKOUT_TOKEN_SECRET not set. Using development fallback. ' +
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

export function generateCheckoutToken(): string {
  const secret = getTokenSecret();
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', secret).update(timestamp).digest('hex');

  return `${timestamp}.${signature}`;
}

export function validateCheckoutToken(token: string | null | undefined): TokenValidationResult {
  if (!token) {
    return { valid: false, error: 'Missing checkout token' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [timestamp, signature] = parts;

  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid token timestamp' };
  }

  const age = Date.now() - timestampNum;
  if (age > TOKEN_EXPIRY_MS) {
    return { valid: false, error: 'Checkout session expired. Please refresh the page.' };
  }

  if (age < -60000) {
    return { valid: false, error: 'Invalid token timestamp' };
  }

  const secret = getTokenSecret();
  const expectedSignature = createHmac('sha256', secret).update(timestamp).digest('hex');

  if (!timingSafeStringEqual(signature, expectedSignature)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  return { valid: true };
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return cryptoTimingSafeEqual(Buffer.from(a), Buffer.from(b));
}
