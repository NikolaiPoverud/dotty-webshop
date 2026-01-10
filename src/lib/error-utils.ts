/**
 * SEC-014: Error sanitization utility
 * Prevents leaking sensitive information in production error messages
 */

const isProduction = process.env.NODE_ENV === 'production';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Sanitize error message for API responses.
 * In production, returns a generic message to prevent info leakage.
 * In development, returns the actual error for debugging.
 */
export function sanitizeErrorMessage(
  error: unknown,
  genericMessage = 'An error occurred'
): string {
  if (isProduction) {
    return genericMessage;
  }
  return getErrorMessage(error);
}

/**
 * Log error details server-side and return sanitized response.
 */
export function handleApiError(
  error: unknown,
  context: string,
  genericMessage = 'An error occurred'
): { message: string; details?: string } {
  console.error(`[${context}]`, error);

  const result: { message: string; details?: string } = { message: genericMessage };

  if (!isProduction) {
    result.details = getErrorMessage(error);
  }

  return result;
}

/**
 * Create a safe error response for Next.js API routes.
 */
export function createErrorResponse(
  error: unknown,
  context: string,
  options: {
    status?: number;
    genericMessage?: string;
  } = {}
): { error: string; status: number } {
  const { status = 500, genericMessage = 'An error occurred' } = options;

  console.error(`[API Error - ${context}]`, {
    error: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    error: sanitizeErrorMessage(error, genericMessage),
    status,
  };
}
