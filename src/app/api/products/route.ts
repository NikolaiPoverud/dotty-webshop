import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/products - List all available products (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const collection = searchParams.get('collection');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('products')
      .select('id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry')
      .order('display_order', { ascending: true });

    // Filter by availability (show all, including sold, but mark them)
    // The shop will handle displaying sold items differently

    // Filter by collection if provided
    if (collection) {
      // First get collection ID from slug
      const { data: collectionData } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', collection)
        .single();

      if (collectionData) {
        query = query.eq('collection_id', collectionData.id);
      }
    }

    // Filter featured only
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
