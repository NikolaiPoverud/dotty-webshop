/**
 * SEC-012: CSRF Origin Validation
 * Validates that requests come from allowed origins
 */

import { NextRequest, NextResponse } from 'next/server';

// Allowed origins for CSRF protection
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://dotty.no',
  'https://www.dotty.no',
  'https://dottyartwork.no',
  'https://www.dottyartwork.no',
  'https://dottyartwork.com',
  'https://www.dottyartwork.com',
].filter(Boolean) as string[];

// In development, also allow localhost
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

/**
 * Validate the Origin header for state-changing requests
 * Returns null if valid, or an error response if invalid
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();

  // Only validate state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // For same-origin requests, browser may not send Origin header
  // In that case, check Referer
  const requestOrigin = origin || (referer ? new URL(referer).origin : null);

  // API routes called from server-side won't have Origin
  // Allow these by checking for server-side indicators
  if (!requestOrigin) {
    // Check if it's a webhook (Stripe sends signature header)
    if (request.headers.get('stripe-signature')) {
      return null;
    }
    // Check if it's a cron job
    if (request.headers.get('authorization')?.startsWith('Bearer ')) {
      return null;
    }
    // For other requests without origin, be strict in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('CSRF: Request without origin header blocked');
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }
    return null;
  }

  // Validate origin is in allowed list
  if (!ALLOWED_ORIGINS.some(allowed => requestOrigin === allowed)) {
    console.warn(`CSRF: Request from unauthorized origin: ${requestOrigin}`);
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Middleware helper to add CSRF validation to API routes
 */
export function withCsrfProtection<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (request: NextRequest, ...rest: unknown[]) => {
    const csrfError = validateOrigin(request);
    if (csrfError) return csrfError;
    return handler(request, ...rest);
  }) as T;
}
