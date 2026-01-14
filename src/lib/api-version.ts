/**
 * API Versioning utilities
 *
 * Current version: v1
 *
 * Versioning strategy:
 * - All public API routes are available under /api/v1/
 * - Legacy routes at /api/ redirect to current version for backwards compatibility
 * - Version is included in response headers
 * - Breaking changes require new version (v2, v3, etc.)
 */

export const API_VERSION = '1';
export const API_VERSION_HEADER = 'X-API-Version';

/**
 * Add API version header to response
 */
export function withVersionHeader(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    [API_VERSION_HEADER]: API_VERSION,
  };
}

/**
 * Create versioned response with standard headers
 */
export function versionedJson(
  data: unknown,
  init?: ResponseInit
): Response {
  const headers = new Headers(init?.headers);
  headers.set(API_VERSION_HEADER, API_VERSION);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}
