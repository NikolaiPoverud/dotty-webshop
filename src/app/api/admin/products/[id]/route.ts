import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify, generateRandomSuffix } from '@/lib/utils';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

/**
 * Revalidate all cached pages that display product data.
 * This ensures updated product info (sizes, prices, etc.) appears immediately.
 */
function revalidateProductPages(slug?: string): void {
  // Revalidate entire shop section for both locales (includes all subpages)
  revalidatePath('/no/shop');
  revalidatePath('/en/shop');

  // Revalidate the specific product page if slug is known
  if (slug) {
    revalidatePath(`/no/shop/${slug}`);
    revalidatePath(`/en/shop/${slug}`);
  }

  // Revalidate homepage (featured products)
  revalidatePath('/no');
  revalidatePath('/en');

  // Revalidate sold pages
  revalidatePath('/no/solgt');
  revalidatePath('/en/sold');

  // Also revalidate the root layout to be thorough
  revalidatePath('/', 'layout');
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UPDATABLE_FIELDS = [
  'description', 'price', 'image_url', 'image_path', 'product_type',
  'stock_quantity', 'collection_id', 'is_available', 'is_featured',
  'is_public', 'sizes', 'gallery_images', 'display_order', 'shipping_cost',
  'shipping_size', 'requires_inquiry', 'year',
] as const;

function handleSupabaseError(error: { code: string; message: string }): NextResponse {
  if (error.code === 'PGRST116') {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// GET /api/admin/products/[id] - Get single product
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    // Handle title separately since it requires slug regeneration
    if (body.title !== undefined) {
      updateData.title = body.title;
      const newSlug = slugify(body.title);
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .single();
      updateData.slug = existing ? `${newSlug}-${generateRandomSuffix()}` : newSlug;
    }

    // Copy other updatable fields if present
    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = field === 'price' ? Math.round(body[field]) : body[field];
      }
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    await logAudit({
      action: 'product_update',
      entity_type: 'product',
      entity_id: id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { title: product.title, changes: Object.keys(updateData) },
      ...getAuditHeadersFromRequest(request),
    });

    // Revalidate cached pages to show updated product data immediately
    revalidateProductPages(product.slug);

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] - Soft delete product
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: product } = await supabase
      .from('products')
      .select('image_path, slug')
      .eq('id', id)
      .single();

    if (product?.image_path) {
      await supabase.storage.from('artwork').remove([product.image_path]);
    }

    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      action: 'product_delete',
      entity_type: 'product',
      entity_id: id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { image_path: product?.image_path },
      ...getAuditHeadersFromRequest(request),
    });

    // Revalidate cached pages to remove deleted product
    revalidateProductPages(product?.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
