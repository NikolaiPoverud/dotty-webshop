import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';
import { logAudit, getIpFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { parsePaginationParams, getPaginationRange, buildPaginationResult } from '@/lib/pagination';

// GET /api/admin/products - List all products with pagination
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // DB-010: Parse pagination params
    const paginationParams = parsePaginationParams(searchParams);
    const { from, to } = getPaginationRange(paginationParams);

    // Optional filters
    const collectionId = searchParams.get('collection_id');
    const productType = searchParams.get('product_type');
    const isAvailable = searchParams.get('is_available');

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)  // Exclude soft-deleted
      .order('display_order', { ascending: true })
      .range(from, to);

    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }
    if (productType) {
      query = query.eq('product_type', productType);
    }
    if (isAvailable !== null) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(buildPaginationResult(products || [], count, paginationParams));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

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
      gallery_images,
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
        stock_quantity: stock_quantity ?? 1, // Default to 1 (originals have 1, prints start with 1)
        collection_id: collection_id || null,
        is_available: is_available ?? true,
        is_featured: is_featured ?? false,
        sizes: sizes || [],
        gallery_images: gallery_images || [],
        display_order,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit
    await logAudit({
      action: 'product_create',
      entity_type: 'product',
      entity_id: product.id,
      actor_type: 'admin',
      details: { title: product.title, price: product.price, product_type: product.product_type },
      ip_address: getIpFromRequest(request),
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
