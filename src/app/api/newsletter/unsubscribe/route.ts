import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseClient } from '@supabase/supabase-js';

interface Subscriber {
  id: string;
  email: string;
  unsubscribed_at: string | null;
}

async function markAsUnsubscribed(
  supabase: SupabaseClient,
  subscriber: Subscriber,
  logAudit: boolean
): Promise<NextResponse> {
  if (subscriber.unsubscribed_at) {
    return NextResponse.json({
      success: true,
      message: 'Already unsubscribed',
      already_unsubscribed: true,
    });
  }

  const { error: updateError } = await supabase
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', subscriber.id);

  if (updateError) {
    console.error('Failed to unsubscribe:', updateError);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }

  if (logAudit) {
    await supabase.from('audit_log').insert({
      action: 'newsletter_unsubscribe',
      entity_type: 'newsletter_subscriber',
      entity_id: subscriber.id,
      actor_type: 'customer',
      actor_id: subscriber.email,
      details: { email: subscriber.email },
    });
  }

  return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing unsubscribe token' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: subscriber, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, unsubscribed_at')
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !subscriber) {
      return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 404 });
    }

    return markAsUnsubscribed(supabase, subscriber, true);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: subscriber, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, unsubscribed_at')
      .eq('email', email.toLowerCase())
      .single();

    if (findError || !subscriber) {
      return NextResponse.json({
        success: true,
        message: 'If this email was subscribed, it has been unsubscribed',
      });
    }

    return markAsUnsubscribed(supabase, subscriber, false);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
