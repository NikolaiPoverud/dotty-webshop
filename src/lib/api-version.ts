/**
 * API Versioning constants
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
