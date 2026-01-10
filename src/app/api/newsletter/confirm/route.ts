import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function redirectToStatus(request: NextRequest, status: string): NextResponse {
  return NextResponse.redirect(new URL(`/no/newsletter-confirmed?status=${status}`, request.url));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return redirectToStatus(request, 'invalid');
    }

    const supabase = createAdminClient();

    const { data: subscriber, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (findError || !subscriber) {
      return redirectToStatus(request, 'invalid');
    }

    if (subscriber.is_confirmed) {
      return redirectToStatus(request, 'already');
    }

    if (subscriber.unsubscribed_at) {
      return redirectToStatus(request, 'unsubscribed');
    }

    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ is_confirmed: true })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Failed to confirm subscription:', updateError);
      return redirectToStatus(request, 'error');
    }

    await supabase.from('audit_log').insert({
      action: 'newsletter_confirmed',
      entity_type: 'newsletter_subscriber',
      entity_id: subscriber.id,
      actor_type: 'customer',
      actor_id: subscriber.email,
      details: { email: subscriber.email },
    });

    return redirectToStatus(request, 'success');
  } catch (error) {
    console.error('Newsletter confirmation error:', error);
    return redirectToStatus(request, 'error');
  }
}
