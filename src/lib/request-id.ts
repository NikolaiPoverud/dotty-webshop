/**
 * SEC-014: Request ID correlation for logging
 *
 * Generates unique request IDs and provides utilities for log correlation.
 * Each request gets a unique ID that flows through all related log entries,
 * making it easy to trace issues across multiple log lines.
 */

import { NextRequest } from 'next/server';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generate a unique request ID
 * Format: timestamp-random (e.g., "173698374321-a1b2c3d4")
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Get or generate request ID from incoming request
 * Uses existing x-request-id header if present (for tracing across services)
 * Otherwise generates a new ID
 */
export function getRequestId(request: NextRequest): string {
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  return existingId || generateRequestId();
}

/**
 * Create a logger instance bound to a specific request ID
 * All log entries will include the request ID for correlation
 */
export function createRequestLogger(requestId: string, context: string) {
  const prefix = `[${context}] [req:${requestId}]`;

  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
    },
    error: (message: string, error?: unknown, data?: Record<string, unknown>) => {
      const errorInfo = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { raw: String(error) };

      console.error(`${prefix} ${message}`, {
        error: errorInfo,
        ...data,
      });
    },
    debug: (message: string, data?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
      }
    },
  };
}

/**
 * Response headers helper to include request ID in response
 * Helps clients correlate their requests with server logs
 */
export function addRequestIdHeader(
  headers: Headers,
  requestId: string
): Headers {
  headers.set(REQUEST_ID_HEADER, requestId);
  return headers;
}

/**
 * Higher-order function to wrap API route handlers with request ID
 */
export function withRequestId<T extends NextRequest>(
  handler: (request: T, requestId: string) => Promise<Response>
): (request: T) => Promise<Response> {
  return async (request: T) => {
    const requestId = getRequestId(request);

    try {
      const response = await handler(request, requestId);

      // Add request ID to response headers
      const newHeaders = new Headers(response.headers);
      addRequestIdHeader(newHeaders, requestId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      console.error(`[API] [req:${requestId}] Unhandled error:`, error);
      throw error;
    }
  };
}
