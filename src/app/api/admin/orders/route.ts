import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
