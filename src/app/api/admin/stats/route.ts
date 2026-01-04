import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Fetch all data in parallel - optimized with counts and filters
    const [
      ordersThisMonth,
      totalProductsCount,
      availableProductsCount,
      totalSubscribersCount,
      subscribersThisMonthCount,
      recentOrders,
    ] = await Promise.all([
      // Orders this month - only needed fields
      supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth),

      // Total products count
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true }),

      // Available products count
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', true),

      // Total subscribers count
      supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true }),

      // Subscribers this month count
      supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),

      // Recent orders - only needed fields
      supabase
        .from('orders')
        .select('id, order_number, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Calculate stats from optimized queries
    const ordersData = ordersThisMonth.data || [];
    const salesThisMonth = ordersData
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCountThisMonth = ordersData.length;

    const totalProducts = totalProductsCount.count || 0;
    const availableProducts = availableProductsCount.count || 0;
    const totalSubscribers = totalSubscribersCount.count || 0;
    const subscribersThisMonth = subscribersThisMonthCount.count || 0;

    return NextResponse.json({
      data: {
        salesThisMonth,
        orderCountThisMonth,
        totalProducts,
        availableProducts,
        totalSubscribers,
        subscribersThisMonth,
        recentOrders: recentOrders.data || [],
      }
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
