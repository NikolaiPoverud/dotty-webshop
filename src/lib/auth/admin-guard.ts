import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errors } from '@/lib/api-response';

export interface AdminAuthResult {
  authorized: true;
  user: { id: string; email: string; role: string };
}

export interface AdminAuthError {
  authorized: false;
  response: NextResponse;
}

export type AdminAuth = AdminAuthResult | AdminAuthError;

/**
 * SEC-001: Role-Based Access Control (RBAC) for admin endpoints.
 *
 * Verify that the request is from an authenticated user WITH admin role.
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
    console.warn('Admin API unauthorized access attempt - no user session');
    return { authorized: false, response: errors.unauthorized() };
  }

  // SEC-001: Check admin role in user metadata
  // Admin users must have role: 'admin' set in their user_metadata
  const role = data.user.user_metadata?.role;
  if (role !== 'admin') {
    console.warn(
      `SEC-001: Non-admin user ${data.user.id} (${data.user.email}) attempted admin access. ` +
      `Role: ${role || 'none'}`
    );
    return { authorized: false, response: errors.forbidden() };
  }

  return {
    authorized: true,
    user: { id: data.user.id, email: data.user.email ?? 'unknown', role },
  };
}
