/**
 * SEC-014: Error sanitization utility
 * Prevents leaking sensitive information in production error messages
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize error message for API responses
 * In production, returns a generic message to prevent info leakage
 * In development, returns the actual error for debugging
 */
export function sanitizeErrorMessage(
  error: unknown,
  genericMessage = 'An error occurred'
): string {
  if (!isProduction) {
    // In development, show actual error
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // In production, return generic message
  return genericMessage;
}

/**
 * Log error details server-side and return sanitized response
 */
export function handleApiError(
  error: unknown,
  context: string,
  genericMessage = 'An error occurred'
): { message: string; details?: string } {
  // Always log the full error server-side
  console.error(`[${context}]`, error);

  if (!isProduction) {
    return {
      message: genericMessage,
      details: error instanceof Error ? error.message : String(error),
    };
  }

  // In production, only return generic message
  return { message: genericMessage };
}

/**
 * Create a safe error response for Next.js API routes
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

  // Log full error details
  console.error(`[API Error - ${context}]`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    error: isProduction ? genericMessage : sanitizeErrorMessage(error, genericMessage),
    status,
  };
}
