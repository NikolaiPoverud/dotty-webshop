import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';

// GET /api/admin/products - List all products
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: products });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      title,
      description,
      price,
      image_url,
      image_path,
      product_type,
      stock_quantity,
      collection_id,
      is_available,
      is_featured,
      sizes,
    } = body;

    // Validate required fields
    if (!title || !price) {
      return NextResponse.json(
        { error: 'Title and price are required' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = slugify(title);

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('products')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = (maxOrder?.display_order || 0) + 1;

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        title,
        description: description || null,
        slug: finalSlug,
        price: Math.round(price), // Ensure integer (øre)
        image_url: image_url || '',
        image_path: image_path || '',
        product_type: product_type || 'original',
        stock_quantity: product_type === 'print' ? (stock_quantity || 0) : null,
        collection_id: collection_id || null,
        is_available: is_available ?? true,
        is_featured: is_featured ?? false,
        sizes: sizes || [],
        display_order,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
