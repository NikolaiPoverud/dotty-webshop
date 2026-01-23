import { NextRequest, NextResponse } from 'next/server';

import { success, errors } from '@/lib/api-response';
import { API_VERSION_HEADER, API_VERSION } from '@/lib/api-version';
import { createClient } from '@/lib/supabase/server';
import type { ProductListItem } from '@/types';

const PRODUCT_FIELDS =
  'id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const collection = searchParams.get('collection');
  const featured = searchParams.get('featured');

  let query = supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .is('deleted_at', null)
    .eq('is_public', true)
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
  response.headers.set(API_VERSION_HEADER, API_VERSION);
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  return response;
}
