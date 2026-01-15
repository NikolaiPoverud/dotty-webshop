import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/vipps';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateCheckoutToken } from '@/lib/checkout-token';
import type { ShippingAddress, OrderItem, Locale } from '@/types';

interface VippsCheckoutRequest {
  items: OrderItem[];
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  discount_code?: string;
  discount_amount?: number;
  shipping_cost?: number;
  artist_levy?: number;
  locale?: Locale;
  privacy_accepted?: boolean;
  newsletter_opt_in?: boolean;
  checkout_token?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limiting: 5 requests per minute per IP for Vipps checkout
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`vipps:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many payment attempts. Please wait a minute and try again.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
    );
  }

  try {
    const body = await request.json() as VippsCheckoutRequest;

    // SEC-002: Validate checkout token to ensure request originated from legitimate checkout
    const tokenValidation = validateCheckoutToken(body.checkout_token);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: tokenValidation.error || 'Invalid checkout session' },
        { status: 403 },
      );
    }
    const {
      items,
      customer_email,
      customer_name,
      customer_phone,
      shipping_address,
      discount_code,
      discount_amount = 0,
      shipping_cost = 0,
      artist_levy = 0,
      locale = 'no',
      privacy_accepted = false,
      newsletter_opt_in = false,
    } = body;

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!customer_email || !customer_name || !customer_phone || !shipping_address) {
      return NextResponse.json({ error: 'Missing customer information' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + shipping_cost + artist_levy - discount_amount;

    // Generate unique order reference
    const reference = `DOTTY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Store pending order in database
    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from('orders').insert({
      id: reference,
      customer_email,
      customer_name,
      customer_phone,
      shipping_address,
      items,
      subtotal,
      discount_code,
      discount_amount,
      shipping_cost,
      artist_levy,
      total,
      payment_provider: 'vipps',
      payment_status: 'pending',
      privacy_accepted,
      newsletter_opt_in,
    });

    if (dbError) {
      console.error('Failed to create pending order:', dbError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Get return URL
    const origin = getCanonicalOrigin(request);
    const isEnglish = locale === 'en';
    const returnUrl = `${origin}/api/vipps/callback?reference=${reference}&locale=${locale}`;

    // Create Vipps payment
    const description = items.length === 1
      ? items[0].title
      : `${items.length} ${locale === 'no' ? 'produkter fra Dotty.' : 'items from Dotty.'}`;

    const payment = await createPayment({
      reference,
      amount: total,
      description,
      returnUrl,
      customerPhone: customer_phone,
    });

    if (!payment.redirectUrl) {
      // Clean up pending order
      await supabase.from('orders').delete().eq('id', reference);
      return NextResponse.json({ error: 'Failed to create Vipps payment' }, { status: 500 });
    }

    return NextResponse.json({
      reference,
      redirectUrl: payment.redirectUrl,
    });

  } catch (error) {
    // SEC-015: Log full error server-side but return generic message to client
    console.error('Vipps initiate error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment. Please try again.' },
      { status: 500 },
    );
  }
}

function getCanonicalOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin')
    || request.headers.get('referer')?.split('/').slice(0, 3).join('/')
    || process.env.NEXT_PUBLIC_SITE_URL
    || 'https://dotty.no';
  return origin.replace('://www.', '://');
}
