import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify, generateRandomSuffix } from '@/lib/utils';
import { logAudit, getAuditHeadersFromRequest } from '@/lib/audit';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';
import { parsePaginationParams, getPaginationRange, buildPaginationResult } from '@/lib/pagination';
import { validateCreateProduct } from '@/lib/schemas/product';
import { success, errors } from '@/lib/api-response';

function revalidateProductPages(): void {
  revalidatePath('/no/shop', 'page');
  revalidatePath('/en/shop', 'page');
  revalidatePath('/no', 'page');
  revalidatePath('/en', 'page');
}
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const paginationParams = parsePaginationParams(searchParams);
    const { from, to } = getPaginationRange(paginationParams);

    const collectionId = searchParams.get('collection_id');
    const productType = searchParams.get('product_type');
    const isAvailable = searchParams.get('is_available');

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .range(from, to);

    if (collectionId) query = query.eq('collection_id', collectionId);
    if (productType) query = query.eq('product_type', productType);
    if (isAvailable !== null) query = query.eq('is_available', isAvailable === 'true');

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return errors.internal('Failed to fetch products');
    }

    return NextResponse.json(buildPaginationResult(products ?? [], count, paginationParams));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return errors.internal('Failed to fetch products');
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createAdminClient();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errors.badRequest('Invalid JSON in request body');
    }

    const validationResult = validateCreateProduct(rawBody);
    if (!validationResult.success) {
      return errors.badRequest(validationResult.error);
    }

    const body = validationResult.data;

    const slug = slugify(body.title);
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    const finalSlug = existing ? `${slug}-${generateRandomSuffix()}` : slug;

    const { data: maxOrder } = await supabase
      .from('products')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        title: body.title,
        description: body.description ?? null,
        slug: finalSlug,
        price: body.price,
        image_url: body.image_url,
        image_path: body.image_path,
        product_type: body.product_type,
        stock_quantity: body.stock_quantity,
        collection_id: body.collection_id ?? null,
        is_available: body.is_available,
        is_featured: body.is_featured,
        is_public: body.is_public ?? true,
        sizes: body.sizes,
        gallery_images: body.gallery_images,
        display_order: (maxOrder?.display_order ?? 0) + 1,
        shipping_cost: body.shipping_cost ?? null,
        shipping_size: body.shipping_size ?? null,
        requires_inquiry: body.requires_inquiry,
        year: body.year ?? null,
        sku: body.sku ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return errors.internal('Failed to create product');
    }

    await logAudit({
      action: 'product_create',
      entity_type: 'product',
      entity_id: product.id,
      actor_type: 'admin',
      actor_id: auth.user.id,
      details: { title: product.title, price: product.price, product_type: product.product_type },
      ...getAuditHeadersFromRequest(request),
    });

    revalidateProductPages();
    const response = success(product);
    return new NextResponse(response.body, { status: 201, headers: response.headers });
  } catch (error) {
    console.error('Failed to create product:', error);
    return errors.internal('Failed to create product');
  }
}
