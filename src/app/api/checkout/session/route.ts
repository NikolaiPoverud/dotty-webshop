import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

// SEC-011: Mask email to prevent full PII exposure in API response
function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [localPart, domain] = email.split('@');
  if (!domain) return null;

  const maskedLocal = localPart.length > 2
    ? localPart[0] + '***' + localPart[localPart.length - 1]
    : localPart[0] + '***';

  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0].length > 2
    ? domainParts[0][0] + '***'
    : domainParts[0][0] + '*';

  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id' },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Try to find the order in our database
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_email, total')
      .eq('payment_session_id', sessionId)
      .single();

    // SEC-011: Return masked email to prevent PII exposure
    return NextResponse.json({
      order: order ? {
        id: order.id,
        email: maskEmail(order.customer_email),
        total: order.total,
      } : {
        id: session.id,
        email: maskEmail(session.customer_email),
        total: session.amount_total,
      },
    });

  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
