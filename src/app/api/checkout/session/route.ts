import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
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

    return NextResponse.json({
      order: order ? {
        id: order.id,
        email: order.customer_email,
        total: order.total,
      } : {
        id: session.id,
        email: session.customer_email,
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
