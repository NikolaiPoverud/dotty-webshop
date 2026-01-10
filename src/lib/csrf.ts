/**
 * SEC-012: CSRF Origin Validation
 * Validates that requests come from allowed origins
 */

import { NextRequest, NextResponse } from 'next/server.js';

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'https://dotty.no',
  'https://www.dotty.no',
  'https://dottyartwork.no',
  'https://www.dottyartwork.no',
  'https://dottyartwork.com',
  'https://www.dottyartwork.com',
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : []),
].filter((origin): origin is string => Boolean(origin));

function createForbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
}

function getRequestOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (referer) return new URL(referer).origin;

  return null;
}

function isServerSideRequest(request: NextRequest): boolean {
  const hasStripeSignature = Boolean(request.headers.get('stripe-signature'));
  const hasBearerToken = request.headers.get('authorization')?.startsWith('Bearer ') ?? false;

  return hasStripeSignature || hasBearerToken;
}

/**
 * Validate the Origin header for state-changing requests.
 * Returns null if valid, or an error response if invalid.
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();

  if (!STATE_CHANGING_METHODS.includes(method)) {
    return null;
  }

  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    if (isServerSideRequest(request)) {
      return null;
    }
    if (process.env.NODE_ENV === 'production') {
      console.warn('CSRF: Request without origin header blocked');
      return createForbiddenResponse();
    }
    return null;
  }

  if (!ALLOWED_ORIGINS.includes(requestOrigin)) {
    console.warn(`CSRF: Request from unauthorized origin: ${requestOrigin}`);
    return createForbiddenResponse();
  }

  return null;
}

type RouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

/**
 * Middleware helper to add CSRF validation to API routes.
 */
export function withCsrfProtection<T extends RouteHandler>(handler: T): T {
  return (async (request: NextRequest, ...rest: unknown[]) => {
    const csrfError = validateOrigin(request);
    if (csrfError) return csrfError;
    return handler(request, ...rest);
  }) as T;
}
