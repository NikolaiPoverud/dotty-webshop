import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendShippingNotification, sendDeliveryConfirmation } from '@/lib/email/send';
import type { Order } from '@/types';
import { logAudit, getIpFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

const STATUS_EMAIL_HANDLERS: Record<string, (order: Order) => Promise<{ success: boolean; error?: string }>> = {
  shipped: sendShippingNotification,
  delivered: sendDeliveryConfirmation,
};

function sendStatusChangeEmail(order: Order, previousStatus: string | undefined): void {
  if (previousStatus === order.status) return;

  const handler = STATUS_EMAIL_HANDLERS[order.status];
  if (!handler) return;

  handler(order).catch((err) => {
    console.error(`Failed to send ${order.status} email for order ${order.id}:`, err);
  });
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
      ip_address: getIpFromRequest(request),
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
