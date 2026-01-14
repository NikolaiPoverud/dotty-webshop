import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendShippingNotification, sendDeliveryConfirmation } from '@/lib/email/send';
import type { Order, OrderWithItems, OrderItem } from '@/types';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

// DB-003: Helper to load order items from junction table
async function loadOrderWithItems(order: Order): Promise<OrderWithItems> {
  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, title, price, quantity, image_url')
    .eq('order_id', order.id);

  return {
    ...order,
    items: (items ?? []) as OrderItem[],
  };
}

async function sendStatusChangeEmail(order: Order, previousStatus: string | undefined): Promise<void> {
  if (previousStatus === order.status) return;

  try {
    if (order.status === 'shipped') {
      const orderWithItems = await loadOrderWithItems(order);
      await sendShippingNotification(orderWithItems);
    } else if (order.status === 'delivered') {
      await sendDeliveryConfirmation(order);
    }
  } catch (err) {
    console.error(`Failed to send ${order.status} email for order ${order.id}:`, err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    const previousStatus = currentOrder?.status;

    const { data, error } = await supabase
      .from('orders')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const updatedOrder = data as Order;

    sendStatusChangeEmail(updatedOrder, previousStatus);

    await logAudit({
      action: 'order_update',
      entity_type: 'order',
      entity_id: id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: {
        previous_status: previousStatus,
        new_status: updatedOrder.status,
        customer_email: updatedOrder.customer_email,
        changes: Object.keys(body),
      },
      ...getAuditHeadersFromRequest(request),
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
