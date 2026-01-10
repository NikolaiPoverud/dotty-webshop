import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/send';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { parsePaginationParams, getPaginationRange, buildPaginationResult } from '@/lib/pagination';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const paginationParams = parsePaginationParams(searchParams);
    const { from, to } = getPaginationRange(paginationParams);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,order_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json(buildPaginationResult(data || [], count, paginationParams));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

interface OrderItem {
  price: number;
  quantity: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    if (!customer_email || !customer_name || !customer_phone || !shipping_address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );
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

    if (error) throw error;

    sendOrderEmails(order).catch((err) => {
      console.error('Email sending failed:', err);
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
