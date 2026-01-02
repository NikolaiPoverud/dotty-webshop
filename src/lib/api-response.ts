import { NextResponse } from 'next/server';

/**
 * Standardized API response format
 * All API responses follow this structure for consistency
 */

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

/**
 * Create a success response
 */
export function success<T>(data?: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return NextResponse.json(body);
}

/**
 * Create an error response
 */
export function error(
  message: string,
  status: number = 500,
  code?: string
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = { success: false, error: message };
  if (code) body.code = code;
  return NextResponse.json(body, { status });
}

/**
 * Common error responses
 */
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
 * Create a paginated success response
 */
export function paginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number }
): NextResponse<ApiSuccessResponse<{ items: T[]; pagination: typeof pagination }>> {
  return success({
    items: data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
    },
  });
}
