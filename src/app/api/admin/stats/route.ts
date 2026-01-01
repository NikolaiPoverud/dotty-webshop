import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Fetch all data in parallel
    const [
      ordersThisMonth,
      allProducts,
      subscribers,
      recentOrders,
    ] = await Promise.all([
      // Orders this month
      supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth),

      // All products
      supabase
        .from('products')
        .select('id, is_available'),

      // Newsletter subscribers
      supabase
        .from('newsletter_subscribers')
        .select('id, created_at'),

      // Recent orders for display
      supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Calculate stats
    const ordersData = ordersThisMonth.data || [];
    const salesThisMonth = ordersData
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCountThisMonth = ordersData.length;

    const productsData = allProducts.data || [];
    const totalProducts = productsData.length;
    const availableProducts = productsData.filter(p => p.is_available).length;

    const subscribersData = subscribers.data || [];
    const totalSubscribers = subscribersData.length;
    const subscribersThisMonth = subscribersData.filter(s => {
      const created = new Date(s.created_at);
      return created >= new Date(startOfMonth);
    }).length;

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
