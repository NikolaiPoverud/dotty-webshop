/**
 * ARCH-004: Product Service Layer
 *
 * Extracts product-related business logic from API routes into a
 * reusable service layer. This improves testability, maintainability,
 * and separation of concerns.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { slugify, generateRandomSuffix } from '@/lib/utils';
import type { Product, ProductListItem } from '@/types';
import type { CreateProductInput } from '@/lib/schemas/product';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProductFilters {
  collectionId?: string;
  productType?: 'original' | 'print';
  isAvailable?: boolean;
  isFeatured?: boolean;
}

/**
 * Get paginated list of products with optional filters
 */
export async function listProducts(
  params: PaginationParams,
  filters: ProductFilters = {}
): Promise<ServiceResult<ProductListResult>> {
  const supabase = createAdminClient();
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.collectionId) {
    query = query.eq('collection_id', filters.collectionId);
  }
  if (filters.productType) {
    query = query.eq('product_type', filters.productType);
  }
  if (filters.isAvailable !== undefined) {
    query = query.eq('is_available', filters.isAvailable);
  }
  if (filters.isFeatured !== undefined) {
    query = query.eq('is_featured', filters.isFeatured);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Product list error:', error);
    return { success: false, error: 'Failed to fetch products' };
  }

  return {
    success: true,
    data: {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > offset + (data?.length ?? 0),
    },
  };
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  id: string
): Promise<ServiceResult<Product>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Product not found' };
    }
    console.error('Get product error:', error);
    return { success: false, error: 'Failed to fetch product' };
  }

  return { success: true, data };
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(
  slug: string
): Promise<ServiceResult<Product>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Product not found' };
    }
    console.error('Get product by slug error:', error);
    return { success: false, error: 'Failed to fetch product' };
  }

  return { success: true, data };
}

/**
 * Create a new product
 */
export async function createProduct(
  input: CreateProductInput
): Promise<ServiceResult<Product>> {
  const supabase = createAdminClient();

  // Generate unique slug
  const baseSlug = slugify(input.title);
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', baseSlug)
    .single();

  const slug = existing ? `${baseSlug}-${generateRandomSuffix()}` : baseSlug;

  // Get next display order
  const { data: maxOrder } = await supabase
    .from('products')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const displayOrder = (maxOrder?.display_order ?? 0) + 1;

  // Insert product
  const { data, error } = await supabase
    .from('products')
    .insert({
      title: input.title,
      description: input.description ?? null,
      slug,
      price: input.price,
      image_url: input.image_url ?? '',
      image_path: input.image_path ?? '',
      product_type: input.product_type ?? 'original',
      stock_quantity: input.stock_quantity ?? 1,
      collection_id: input.collection_id ?? null,
      is_available: input.is_available ?? true,
      is_featured: input.is_featured ?? false,
      sizes: input.sizes ?? [],
      gallery_images: input.gallery_images ?? [],
      display_order: displayOrder,
      shipping_cost: input.shipping_cost ?? null,
      shipping_size: input.shipping_size ?? null,
      requires_inquiry: input.requires_inquiry ?? false,
      year: input.year ?? null,
      sku: input.sku ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Create product error:', error);
    return { success: false, error: 'Failed to create product' };
  }

  return { success: true, data };
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  updates: Partial<CreateProductInput>
): Promise<ServiceResult<Product>> {
  const supabase = createAdminClient();

  // Check product exists
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id, slug')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Product not found' };
  }

  // If title changed, update slug
  let newSlug = existing.slug;
  if (updates.title) {
    const baseSlug = slugify(updates.title);
    if (baseSlug !== existing.slug) {
      const { data: slugExists } = await supabase
        .from('products')
        .select('id')
        .eq('slug', baseSlug)
        .neq('id', id)
        .single();

      newSlug = slugExists ? `${baseSlug}-${generateRandomSuffix()}` : baseSlug;
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      slug: newSlug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Update product error:', error);
    return { success: false, error: 'Failed to update product' };
  }

  return { success: true, data };
}

/**
 * Soft delete a product
 */
export async function deleteProduct(
  id: string
): Promise<ServiceResult<{ id: string }>> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    console.error('Delete product error:', error);
    return { success: false, error: 'Failed to delete product' };
  }

  return { success: true, data: { id } };
}

/**
 * Reorder products
 */
export async function reorderProducts(
  items: Array<{ id: string; display_order: number }>
): Promise<ServiceResult<void>> {
  const supabase = createAdminClient();

  // Update all products in a transaction-like manner
  const updates = items.map(item =>
    supabase
      .from('products')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some(r => r.error);

  if (hasError) {
    return { success: false, error: 'Failed to update some products' };
  }

  return { success: true };
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(
  limit = 6
): Promise<ServiceResult<ProductListItem[]>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry')
    .eq('is_featured', true)
    .eq('is_available', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Featured products error:', error);
    return { success: false, error: 'Failed to fetch featured products' };
  }

  return { success: true, data: data ?? [] };
}
