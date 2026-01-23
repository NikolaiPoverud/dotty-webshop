import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const reference = request.nextUrl.searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, total, items')
      .eq('order_number', reference)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        email: order.customer_email,
        total: order.total,
        items: order.items,
      },
    });
  } catch (error) {
    console.error('Failed to fetch order by reference:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
