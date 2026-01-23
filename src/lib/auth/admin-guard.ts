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

export async function verifyAdminAuth(): Promise<AdminAuth> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    console.warn('Admin API unauthorized access attempt - no user session');
    return { authorized: false, response: errors.unauthorized() };
  }

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
