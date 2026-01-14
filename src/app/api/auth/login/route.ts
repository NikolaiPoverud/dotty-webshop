import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { errors, success } from '@/lib/api-response';

// SEC-008: Rate limit login attempts - 5 attempts per 15 minutes per IP
const LOGIN_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);

  // Apply rate limiting
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

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return errors.badRequest('Invalid request body');
  }

  const { email, password } = body;

  if (!email || !password) {
    return errors.badRequest('Email and password are required');
  }

  // Create Supabase client with anon key for auth operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Don't reveal whether email exists - return generic error
    console.warn(`Login failed for ${email}:`, signInError.message);
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      {
        status: 401,
        headers: getRateLimitHeaders(rateLimitResult),
      },
    );
  }

  // Return session tokens for client to store
  return NextResponse.json(
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
}
