import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

export async function GET(): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  const supabase = createAdminClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const countQuery = (table: string) =>
    supabase.from(table).select('id', { count: 'exact', head: true });

  const [
    ordersThisMonth,
    totalProductsCount,
    availableProductsCount,
    totalSubscribersCount,
    subscribersThisMonthCount,
    recentOrders,
    pendingOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),
    countQuery('products'),
    countQuery('products').eq('is_available', true),
    countQuery('newsletter_subscribers'),
    countQuery('newsletter_subscribers').gte('created_at', startOfMonth),
    supabase
      .from('orders')
      .select('id, order_number, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    countQuery('orders').eq('status', 'pending'),
    countQuery('orders').eq('status', 'paid'),
    countQuery('orders').eq('status', 'shipped'),
    countQuery('orders').eq('status', 'delivered'),
  ]);

  const ordersData = ordersThisMonth.data || [];
  const salesThisMonth = ordersData
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return NextResponse.json({
    data: {
      salesThisMonth,
      orderCountThisMonth: ordersData.length,
      totalProducts: totalProductsCount.count || 0,
      availableProducts: availableProductsCount.count || 0,
      totalSubscribers: totalSubscribersCount.count || 0,
      subscribersThisMonth: subscribersThisMonthCount.count || 0,
      recentOrders: recentOrders.data || [],
      ordersByStatus: {
        pending: pendingOrders.count || 0,
        paid: paidOrders.count || 0,
        shipped: shippedOrders.count || 0,
        delivered: deliveredOrders.count || 0,
      },
    },
  });
}
