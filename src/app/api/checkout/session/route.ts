import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';

const STRIPE_SESSION_ID_PATTERN = /^cs_(test|live)_[a-zA-Z0-9]{20,}$/;
const SESSION_RATE_LIMIT_CONFIG = { maxRequests: 10, windowMs: 60 * 1000 };

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  if (!STRIPE_SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session_id format' }, { status: 400 });
  }

  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`checkout-session:${clientIp}:${sessionId}`, SESSION_RATE_LIMIT_CONFIG);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests for this session' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const stripe = getStripe();

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, total')
    .eq('payment_session_id', sessionId)
    .single();

  if (order) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, title, price, quantity, image_url')
      .eq('order_id', order.id);

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        email: maskEmail(order.customer_email),
        total: order.total,
        items: orderItems || [],
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
