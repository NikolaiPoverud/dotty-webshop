import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// SEC: Allowlist of valid redirect paths after OAuth callback
const ALLOWED_REDIRECT_PREFIXES = ['/admin'];

function sanitizeRedirectPath(next: string | null): string {
  const defaultPath = '/admin/dashboard';
  if (!next) return defaultPath;

  // Must start with / and not contain protocol indicators
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return defaultPath;
  }

  // Must match allowed prefixes
  if (!ALLOWED_REDIRECT_PREFIXES.some(prefix => next.startsWith(prefix))) {
    return defaultPath;
  }

  return next;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
}
