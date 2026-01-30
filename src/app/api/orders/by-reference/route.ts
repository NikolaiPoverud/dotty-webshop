import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Secure order lookup endpoint.
 * Requires either:
 * 1. A valid session_id from the payment provider (Stripe), OR
 * 2. The order was completed within the last 2 hours (for Vipps redirects)
 *
 * This prevents enumeration attacks while still allowing legitimate order lookups.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const reference = request.nextUrl.searchParams.get('reference');
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('orders')
      .select('id, order_number, customer_email, total, items, payment_session_id, status, created_at')
      .eq('order_number', reference);

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security check: Verify caller has legitimate access
    const hasValidSession = sessionId && order.payment_session_id === sessionId;
    const isRecentOrder = isOrderRecent(order.created_at, 2 * 60 * 60 * 1000); // 2 hours
    const isPaidOrder = order.status === 'paid' || order.status === 'shipped';

    // Allow access if: valid session OR (recent order AND paid status)
    if (!hasValidSession && !(isRecentOrder && isPaidOrder)) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Return limited order info (mask email for privacy)
    const maskedEmail = maskEmail(order.customer_email);

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        email: maskedEmail,
        total: order.total,
        items: order.items,
      },
    });
  } catch (error) {
    console.error('Failed to fetch order by reference:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

function isOrderRecent(createdAt: string, maxAgeMs: number): boolean {
  const orderTime = new Date(createdAt).getTime();
  const now = Date.now();
  return (now - orderTime) < maxAgeMs;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return '***@***.***';

  const maskedLocal = localPart.length > 2
    ? localPart[0] + '***' + localPart[localPart.length - 1]
    : '***';

  return `${maskedLocal}@${domain}`;
}
