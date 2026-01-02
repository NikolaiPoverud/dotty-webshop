import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.warn('Admin API unauthorized access attempt');
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email || 'unknown',
      },
    };
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      ),
    };
  }
}
