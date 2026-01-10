import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, total, items')
    .eq('payment_session_id', sessionId)
    .single();

  if (order) {
    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        email: maskEmail(order.customer_email),
        total: order.total,
        items: order.items || [],
      },
    });
  }

  return NextResponse.json({
    order: {
      id: session.id,
      order_number: null,
      email: maskEmail(session.customer_email),
      total: session.amount_total,
      items: [],
    },
  });
}

/** SEC-011: Mask email to prevent full PII exposure in API response */
function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const [localPart, domain] = email.split('@');
  if (!domain) return null;

  const maskedLocal = localPart.length > 2
    ? `${localPart[0]}***${localPart[localPart.length - 1]}`
    : `${localPart[0]}***`;

  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0].length > 2
    ? `${domainParts[0][0]}***`
    : `${domainParts[0][0]}*`;

  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}
