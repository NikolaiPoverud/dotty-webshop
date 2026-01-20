import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendShippingNotification, sendDeliveryConfirmation } from '@/lib/email/send';
import type { Order, OrderWithItems, OrderItem } from '@/types';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { z } from 'zod';

// SEC-003: Zod schema for order updates - whitelist allowed fields only
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
  notes: z.string().max(1000).optional(),
  tracking_carrier: z.string().max(100).optional(),
  tracking_number: z.string().max(100).optional(),
  shipped_at: z.string().datetime().optional(),
  delivered_at: z.string().datetime().optional(),
}).strict(); // Reject any extra fields

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

    // SEC-003: Validate input with Zod schema - prevents mass assignment
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
      .select('status')
      .eq('id', id)
      .single();

    const previousStatus = currentOrder?.status;

    const { data, error } = await supabase
      .from('orders')
      .update(validatedData)
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
      },
      ...getAuditHeadersFromRequest(request),
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
