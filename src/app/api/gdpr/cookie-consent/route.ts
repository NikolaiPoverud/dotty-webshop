import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { consent_given } = body;

    // Get client info
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate or use existing session ID
    const sessionId = uuidv4();

    // Store consent in database
    const { error } = await supabase.from('cookie_consents').insert({
      session_id: sessionId,
      consent_given,
      ip_address: ip,
      user_agent: userAgent.substring(0, 500), // Limit length
    });

    if (error) {
      console.error('Failed to store cookie consent:', error);
      // Don't fail the request - consent is stored locally
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cookie consent error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
