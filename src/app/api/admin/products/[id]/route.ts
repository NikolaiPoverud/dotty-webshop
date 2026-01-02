import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify, generateRandomSuffix } from '@/lib/utils';
import { logAudit, getIpFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
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
      display_order,
    } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      updateData.title = title;
      // Update slug if title changed
      const newSlug = slugify(title);
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .single();
      // SEC-016: Use random suffix instead of predictable timestamp
      updateData.slug = existing ? `${newSlug}-${generateRandomSuffix()}` : newSlug;
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Math.round(price);
    if (image_url !== undefined) updateData.image_url = image_url;
    if (image_path !== undefined) updateData.image_path = image_path;
    if (product_type !== undefined) updateData.product_type = product_type;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (collection_id !== undefined) updateData.collection_id = collection_id;
    if (is_available !== undefined) updateData.is_available = is_available;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (gallery_images !== undefined) updateData.gallery_images = gallery_images;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit with user ID
    await logAudit({
      action: 'product_update',
      entity_type: 'product',
      entity_id: id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { title: product.title, changes: Object.keys(updateData) },
      ip_address: getIpFromRequest(request),
    });

    return NextResponse.json({ data: product });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // First get the product to delete its image from storage
    const { data: product } = await supabase
      .from('products')
      .select('image_path')
      .eq('id', id)
      .single();

    // Delete image from storage if exists
    if (product?.image_path) {
      await supabase.storage.from('artwork').remove([product.image_path]);
    }

    // Soft delete the product
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit with user ID
    await logAudit({
      action: 'product_delete',
      entity_type: 'product',
      entity_id: id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { image_path: product?.image_path },
      ip_address: getIpFromRequest(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
