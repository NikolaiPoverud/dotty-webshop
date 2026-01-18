import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/send';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { parsePaginationParams, getPaginationRange, buildPaginationResult } from '@/lib/pagination';
import { z } from 'zod';

// SEC-003: Zod schema for order creation - whitelist allowed fields
const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1).max(100),
  image_url: z.string().url().optional(),
});

const orderCreateSchema = z.object({
  customer_email: z.string().email().max(254),
  customer_name: z.string().min(1).max(200),
  customer_phone: z.string().min(8).max(20),
  shipping_address: z.union([
    z.string().min(1).max(500),
    z.object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      postal_code: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    }),
  ]),
  items: z.array(orderItemSchema).min(1).max(50),
  discount_code: z.string().max(50).optional(),
  discount_amount: z.number().int().min(0).optional(),
  payment_provider: z.enum(['stripe', 'vipps']).optional(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).optional(),
});

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
      // SEC-016: Escape special characters to prevent pattern injection in LIKE queries
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
      query = query.or(`customer_name.ilike.%${sanitizedSearch}%,customer_email.ilike.%${sanitizedSearch}%,order_number.ilike.%${sanitizedSearch}%`);
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

    // SEC-003: Validate input with Zod schema - prevents mass assignment
    const parseResult = orderCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

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
    } = parseResult.data;

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
