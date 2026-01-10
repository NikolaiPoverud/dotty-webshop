import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errors } from '@/lib/api-response';

export interface AdminAuthResult {
  authorized: true;
  user: { id: string; email: string };
}

export interface AdminAuthError {
  authorized: false;
  response: NextResponse;
}

export type AdminAuth = AdminAuthResult | AdminAuthError;

/**
 * Verify that the request is from an authenticated admin user.
 * Use this at the start of every /api/admin/* route handler.
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const auth = await verifyAdminAuth();
 *   if (!auth.authorized) return auth.response;
 *   // ... rest of handler, auth.user is available
 * }
 */
export async function verifyAdminAuth(): Promise<AdminAuth> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    console.warn('Admin API unauthorized access attempt');
    return { authorized: false, response: errors.unauthorized() };
  }

  return {
    authorized: true,
    user: { id: data.user.id, email: data.user.email ?? 'unknown' },
  };
}
