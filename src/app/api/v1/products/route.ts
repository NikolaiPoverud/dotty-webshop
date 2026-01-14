/**
 * API v1: Products endpoint
 * GET /api/v1/products - List available products
 *
 * Query params:
 * - collection: Filter by collection slug
 * - featured: Filter featured products only (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { success, errors } from '@/lib/api-response';
import { API_VERSION_HEADER, API_VERSION } from '@/lib/api-version';
import type { ProductListItem } from '@/types';

const PRODUCT_FIELDS = 'id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const collection = searchParams.get('collection');
  const featured = searchParams.get('featured');

  let query = supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (collection) {
    const { data: collectionData } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collection)
      .single();

    if (collectionData) {
      query = query.eq('collection_id', collectionData.id);
    }
  }

  if (featured === 'true') {
    query = query.eq('is_featured', true);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('Products API error:', error);
    return errors.internal('Failed to fetch products');
  }

  const response = success<ProductListItem[]>(products ?? []);

  // Add version and cache headers
  response.headers.set(API_VERSION_HEADER, API_VERSION);
  Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
