import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendShippingNotification, sendDeliveryConfirmation } from '@/lib/email/send';
import type { Order, OrderWithItems, OrderItem } from '@/types';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { refundPayment as refundStripePayment } from '@/lib/stripe';
import { refundPayment as refundVippsPayment } from '@/lib/vipps';
import { z } from 'zod';

const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).optional(),
  shipping_address: z.union([
    z.string().min(1).max(500),
    z.object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      postal_code: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    }),
  ]).optional(),
  notes: z.string().max(2000).optional(),
  tracking_carrier: z.string().max(100).optional(),
  tracking_number: z.string().max(100).optional(),
  shipped_at: z.string().datetime().optional(),
  delivered_at: z.string().datetime().optional(),
}).strict();

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
    if (order.status === 'shipped' || order.status === 'delivered') {
      const orderWithItems = await loadOrderWithItems(order);
      if (order.status === 'shipped') {
        await sendShippingNotification(orderWithItems);
      } else {
        await sendDeliveryConfirmation(orderWithItems);
      }
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
    const parseResult = orderUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;
    const supabase = createAdminClient();

    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status, payment_provider, payment_session_id, total')
      .eq('id', id)
      .single();

    const previousStatus = currentOrder?.status;

    let refundResult: { success: boolean; refundId?: string; error?: string } | null = null;
    if (validatedData.status === 'cancelled' && previousStatus !== 'cancelled' && currentOrder) {
      const { payment_provider, payment_session_id, total } = currentOrder;

      if (payment_session_id) {
        if (payment_provider === 'stripe') {
          refundResult = await refundStripePayment(payment_session_id);
        } else if (payment_provider === 'vipps') {
          try {
            await refundVippsPayment(payment_session_id, total);
            refundResult = { success: true };
          } catch (err) {
            refundResult = { success: false, error: err instanceof Error ? err.message : 'Vipps refund failed' };
          }
        }

        // Add refund info to notes
        if (refundResult) {
          const timestamp = new Date().toLocaleString('nb-NO', { timeZone: 'Europe/Oslo' });
          const refundNote = refundResult.success
            ? `Refund processed successfully${refundResult.refundId ? ` (${refundResult.refundId})` : ''}`
            : `Refund failed: ${refundResult.error}`;
          const existingNotes = validatedData.notes || '';
          validatedData.notes = existingNotes
            ? `${existingNotes}\n\n[${timestamp}] ${refundNote}`
            : `[${timestamp}] ${refundNote}`;
        }
      }
    }

    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.status === 'cancelled' && refundResult?.success) {
      updateData.payment_status = 'refunded';
    } else if (validatedData.status === 'cancelled') {
      updateData.payment_status = 'cancelled';
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
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
        changes: Object.keys(validatedData),
        refund: refundResult ? {
          attempted: true,
          success: refundResult.success,
          refundId: refundResult.refundId,
          error: refundResult.error,
        } : undefined,
      },
      ...getAuditHeadersFromRequest(request),
    });

    return NextResponse.json({
      data,
      refund: refundResult ? {
        success: refundResult.success,
        error: refundResult.error,
      } : undefined,
    });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
