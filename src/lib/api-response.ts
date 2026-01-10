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

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export function paginated<T>(
  items: T[],
  pagination: Pagination
): NextResponse<ApiSuccessResponse<{ items: T[]; pagination: Pagination }>> {
  return success({ items, pagination });
}
