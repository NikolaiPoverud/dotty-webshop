import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/send';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { parsePaginationParams, getPaginationRange, buildPaginationResult } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // DB-010: Parse pagination params
    const paginationParams = parsePaginationParams(searchParams);
    const { from, to } = getPaginationRange(paginationParams);

    // Optional status filter
    const status = searchParams.get('status');

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json(buildPaginationResult(data || [], count, paginationParams));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      customer_email,
      customer_name,
      customer_phone,
      shipping_address,
      items,
      discount_code,
      discount_amount,
      payment_provider,
      status,
    } = body;

    // Validate required fields
    if (!customer_email || !customer_name || !customer_phone || !shipping_address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const total = subtotal - (discount_amount || 0);

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_email,
        customer_name,
        customer_phone,
        shipping_address,
        items,
        subtotal,
        discount_code: discount_code || null,
        discount_amount: discount_amount || 0,
        total,
        payment_provider: payment_provider || null,
        status: status || 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send order emails (confirmation to customer, alert to artist)
    // Run in background - don't block response
    sendOrderEmails(order).then((result) => {
      if (!result.confirmation.success) {
        console.error('Failed to send order confirmation email:', result.confirmation.error);
      }
      if (!result.alert.success) {
        console.error('Failed to send new order alert email:', result.alert.error);
      }
    }).catch((err) => {
      console.error('Email sending failed:', err);
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
