import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function success<T>(data?: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  } as ApiSuccessResponse<T>);
}

export function error(
  message: string,
  status = 500,
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
    } as ApiErrorResponse,
    { status }
  );
}

export const errors = {
  unauthorized: (message = 'Unauthorized') => error(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => error(message, 403, 'FORBIDDEN'),
  notFound: (message = 'Not found') => error(message, 404, 'NOT_FOUND'),
  badRequest: (message = 'Bad request') => error(message, 400, 'BAD_REQUEST'),
  conflict: (message = 'Conflict') => error(message, 409, 'CONFLICT'),
  tooManyRequests: (message = 'Too many requests') => error(message, 429, 'RATE_LIMITED'),
  internal: (message = 'Internal server error') => error(message, 500, 'INTERNAL_ERROR'),
};

/**
 * SEC-013: Safe error handler that returns generic message to client
 * while logging full details server-side
 *
 * @param context - Context identifier for logging (e.g., 'ProductAPI', 'Checkout')
 * @param error - The actual error object
 * @param userMessage - Optional user-friendly message (defaults to generic)
 */
export function handleApiError(
  context: string,
  err: unknown,
  userMessage = 'An unexpected error occurred. Please try again.'
): NextResponse<ApiErrorResponse> {
  // Log full error details server-side
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;

  console.error(`[${context}] Error:`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });

  // Return generic message to client
  return errors.internal(userMessage);
}

