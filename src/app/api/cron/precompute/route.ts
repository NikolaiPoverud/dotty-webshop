import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  warmCache,
  kvSet,
  cacheKeys,
  CACHE_TTL,
  kvDelByPrefix,
  CACHE_PREFIXES,
} from '@/lib/cache/kv-cache';

/**
 * Precomputation Cron Job
 *
 * Runs hourly to:
 * 1. Refresh the facet_product_counts materialized view
 * 2. Warm the distributed cache with commonly accessed data
 * 3. Compute sitemap data for fast sitemap generation
 *
 * Schedule: 0 * * * * (every hour at minute 0)
 */
export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) {
    return authResult.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: {},
  };

  try {
    const supabase = createAdminClient();

    // Step 1: Refresh materialized view
    const viewStart = Date.now();
    const { error: viewError } = await supabase.rpc('refresh_facet_product_counts');
    results.steps = {
      ...results.steps as Record<string, unknown>,
      refreshMaterializedView: {
        success: !viewError,
        durationMs: Date.now() - viewStart,
        error: viewError?.message,
      },
    };

    // Step 2: Fetch fresh facet counts from materialized view
    const countsStart = Date.now();
    const { data: facetData, error: facetError } = await supabase
      .from('facet_product_counts')
      .select('*');

    const facetCounts = facetData ? parseFacetCounts(facetData) : null;
    results.steps = {
      ...results.steps as Record<string, unknown>,
      fetchFacetCounts: {
        success: !facetError,
        durationMs: Date.now() - countsStart,
        rowCount: facetData?.length ?? 0,
        error: facetError?.message,
      },
    };

    // Step 3: Fetch available years
    const yearsStart = Date.now();
    const { data: yearsData } = await supabase
      .from('products')
      .select('year')
      .eq('is_public', true)
      .is('deleted_at', null)
      .not('year', 'is', null);

    const availableYears = yearsData
      ? [...new Set(yearsData.map((p) => p.year).filter(Boolean))]
          .sort((a, b) => (b as number) - (a as number)) as number[]
      : [];

    results.steps = {
      ...results.steps as Record<string, unknown>,
      fetchAvailableYears: {
        success: true,
        durationMs: Date.now() - yearsStart,
        yearCount: availableYears.length,
      },
    };

    // Step 4: Fetch top products for pre-caching
    const productsStart = Date.now();
    const { data: topProducts } = await supabase
      .from('products')
      .select('slug, id, title, price, image_url, product_type, is_available, stock_quantity, year, shipping_size, updated_at')
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .limit(100);

    results.steps = {
      ...results.steps as Record<string, unknown>,
      fetchTopProducts: {
        success: true,
        durationMs: Date.now() - productsStart,
        productCount: topProducts?.length ?? 0,
      },
    };

    // Step 5: Warm the cache
    const cacheStart = Date.now();

    // Clear stale cache entries first
    await kvDelByPrefix(CACHE_PREFIXES.sitemapSlugs);

    // Warm cache with fresh data
    await warmCache({
      facetCounts,
      availableYears,
      topProducts: topProducts?.map((p) => ({
        slug: p.slug,
        data: p,
      })),
    });

    results.steps = {
      ...results.steps as Record<string, unknown>,
      warmCache: {
        success: true,
        durationMs: Date.now() - cacheStart,
      },
    };

    // Step 6: Compute and cache sitemap data
    const sitemapStart = Date.now();
    const { data: allProducts } = await supabase
      .from('products')
      .select('slug, updated_at, product_type, year, shipping_size, price')
      .eq('is_public', true)
      .is('deleted_at', null);

    const { data: allCollections } = await supabase
      .from('collections')
      .select('slug, updated_at')
      .eq('is_public', true)
      .is('deleted_at', null);

    if (allProducts) {
      await kvSet(
        cacheKeys.sitemapSlugs('products'),
        allProducts,
        CACHE_TTL.sitemapSlugs
      );
    }

    if (allCollections) {
      await kvSet(
        cacheKeys.sitemapSlugs('collections'),
        allCollections,
        CACHE_TTL.sitemapSlugs
      );
    }

    // Store product count separately for fast sitemap pagination calculation
    await kvSet(
      cacheKeys.sitemapSlugs('product-count'),
      allProducts?.length ?? 0,
      CACHE_TTL.sitemapSlugs
    );

    // Compute sitemap metadata
    const sitemapMeta = {
      productCount: allProducts?.length ?? 0,
      collectionCount: allCollections?.length ?? 0,
      facetCounts: {
        types: Object.values(facetCounts?.types ?? {}).reduce((a, b) => a + b, 0),
        years: availableYears.length,
        sizes: 4, // fixed
        priceRanges: 5, // fixed
      },
      lastComputed: new Date().toISOString(),
    };

    await kvSet(
      cacheKeys.sitemapSlugs('meta'),
      sitemapMeta,
      CACHE_TTL.sitemapSlugs
    );

    results.steps = {
      ...results.steps as Record<string, unknown>,
      computeSitemapData: {
        success: true,
        durationMs: Date.now() - sitemapStart,
        ...sitemapMeta,
      },
    };

    const totalDuration = Date.now() - startTime;
    results.totalDurationMs = totalDuration;
    results.success = true;

    console.log('[Precompute Cron] Completed successfully', {
      totalDurationMs: totalDuration,
      productCount: allProducts?.length,
      yearCount: availableYears.length,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Precompute Cron] Failed:', error);

    return NextResponse.json(
      {
        ...results,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalDurationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

function parseFacetCounts(
  data: Array<{
    product_type: string | null;
    year: number | null;
    shipping_size: string | null;
    price_range: string | null;
    collection_id: string | null;
    product_count: number;
  }>
): {
  types: Record<string, number>;
  sizes: Record<string, number>;
  years: Record<number, number>;
  priceRanges: Record<string, number>;
} {
  const counts = {
    types: { original: 0, print: 0 } as Record<string, number>,
    sizes: { small: 0, medium: 0, large: 0, oversized: 0 } as Record<string, number>,
    years: {} as Record<number, number>,
    priceRanges: {
      'under-2500': 0,
      '2500-5000': 0,
      '5000-10000': 0,
      '10000-25000': 0,
      'over-25000': 0,
    } as Record<string, number>,
  };

  for (const row of data) {
    // Type counts (single-dimension rows)
    if (row.product_type && !row.year && !row.shipping_size && !row.price_range && !row.collection_id) {
      counts.types[row.product_type] = row.product_count;
    }

    // Year counts
    if (row.year && !row.product_type && !row.shipping_size && !row.price_range && !row.collection_id) {
      counts.years[row.year] = row.product_count;
    }

    // Size counts
    if (row.shipping_size && !row.product_type && !row.year && !row.price_range && !row.collection_id) {
      counts.sizes[row.shipping_size] = row.product_count;
    }

    // Price range counts
    if (row.price_range && !row.product_type && !row.year && !row.shipping_size && !row.collection_id) {
      counts.priceRanges[row.price_range] = row.product_count;
    }
  }

  return counts;
}
