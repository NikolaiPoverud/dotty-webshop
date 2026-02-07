import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

interface DailyStat {
  date: string;
  event_type: string;
  count: number;
  unique_sessions: number;
}

interface PopularProduct {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  views: number;
  cart_adds: number;
  purchases: number;
}

interface AnalyticsSummary {
  today: {
    visitors: number;
    product_views: number;
    cart_adds: number;
  };
  week: {
    visitors: number;
    product_views: number;
    cart_adds: number;
  };
  month: {
    visitors: number;
    product_views: number;
    cart_adds: number;
  };
  popular_products: PopularProduct[];
  daily_stats: DailyStat[];
}

export async function GET(): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();

    // Get daily stats
    const { data: dailyStats } = await supabase
      .from('analytics_daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    // Get popular products
    const { data: popularProducts } = await supabase
      .from('analytics_popular_products')
      .select('*')
      .limit(10);

    // Calculate summaries
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const stats = dailyStats || [];

    const todayStats = stats.filter((s) => s.date === today);
    const weekStats = stats.filter((s) => s.date >= weekAgo);
    const monthStats = stats;

    function sumByType(data: DailyStat[], type: string): number {
      return data.filter((s) => s.event_type === type).reduce((sum, s) => sum + (s.count || 0), 0);
    }

    function uniqueVisitors(data: DailyStat[]): number {
      return data.filter((s) => s.event_type === 'page_view').reduce((sum, s) => sum + (s.unique_sessions || 0), 0);
    }

    const summary: AnalyticsSummary = {
      today: {
        visitors: uniqueVisitors(todayStats),
        product_views: sumByType(todayStats, 'product_view'),
        cart_adds: sumByType(todayStats, 'add_to_cart'),
      },
      week: {
        visitors: uniqueVisitors(weekStats),
        product_views: sumByType(weekStats, 'product_view'),
        cart_adds: sumByType(weekStats, 'add_to_cart'),
      },
      month: {
        visitors: uniqueVisitors(monthStats),
        product_views: sumByType(monthStats, 'product_view'),
        cart_adds: sumByType(monthStats, 'add_to_cart'),
      },
      popular_products: (popularProducts || []).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        image_url: p.image_url,
        views: p.views || 0,
        cart_adds: p.cart_adds || 0,
        purchases: p.purchases || 0,
      })),
      daily_stats: stats,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
