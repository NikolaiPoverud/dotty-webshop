import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase/admin';

const LOGIN_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };

async function logLoginAttempt(
  email: string,
  success: boolean,
  ip: string | null,
  userAgent: string | null,
  errorMessage?: string,
): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.rpc('log_admin_login_attempt', {
      attempt_email: email,
      attempt_success: success,
      attempt_ip: ip,
      attempt_user_agent: userAgent,
      attempt_error: errorMessage || null,
    });
  } catch (err) {
    // Don't fail login if logging fails
    console.error('Failed to log login attempt:', err);
  }
}

async function updateLastLogin(userId: string, ip: string | null): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.rpc('update_admin_last_login', {
      user_id: userId,
      login_ip: ip,
    });
  } catch (err) {
    // Don't fail login if update fails
    console.error('Failed to update last login:', err);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  const rateLimitResult = await checkRateLimit(`admin-login:${clientIp}`, LOGIN_RATE_LIMIT);

  if (!rateLimitResult.success) {
    const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          'Retry-After': retryAfterSeconds.toString(),
        },
      },
    );
  }

  let body: { email?: string; password?: string; rememberMe?: boolean };
  try {
    body = await request.json();
  } catch {
    return errors.badRequest('Invalid request body');
  }

  const { email, password } = body;

  if (!email || !password) {
    return errors.badRequest('Email and password are required');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    await logLoginAttempt(email, false, clientIp, userAgent, signInError.message);
    console.warn(`Login failed for ${email}:`, signInError.message);
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      {
        status: 401,
        headers: getRateLimitHeaders(rateLimitResult),
      },
    );
  }

  if (data.user) {
    await Promise.all([
      logLoginAttempt(email, true, clientIp, userAgent),
      updateLastLogin(data.user.id, clientIp),
    ]);
  }

  const response = NextResponse.json(
    {
      success: true,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    },
    { headers: getRateLimitHeaders(rateLimitResult) },
  );

  return response;
}
