import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: products }, { headers: CACHE_HEADERS });
}
