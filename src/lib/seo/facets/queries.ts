/**
 * Faceted SEO Database Queries
 *
 * Provides efficient database queries for faceted pages.
 * Uses Supabase with optimized column selection for performance.
 */

import 'server-only';

import type { ProductListItem, Locale, ShippingSize } from '@/types';
import { createPublicClient } from '@/lib/supabase/public';
import {
  type TypeFacetValue,
  type PriceRange,
  getTypeValueFromSlug,
  getSizeValueFromSlug,
  getPriceRange,
} from './index';

// Standard columns for product list queries
const PRODUCT_LIST_COLUMNS = 'id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry';

// ============================================================================
// Base Query Builder
// ============================================================================

function baseProductQuery() {
  const supabase = createPublicClient();
  return supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });
}

// ============================================================================
// Type Facet Queries
// ============================================================================

export async function getProductsByType(
  typeSlug: string,
  locale: Locale
): Promise<ProductListItem[]> {
  const typeValue = getTypeValueFromSlug(typeSlug, locale);
  if (!typeValue) return [];

  const { data, error } = await baseProductQuery()
    .eq('product_type', typeValue);

  if (error) {
    console.error('Failed to fetch products by type:', error);
    return [];
  }
  return data ?? [];
}

export async function getProductCountByType(
  type: TypeFacetValue
): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
    .is('deleted_at', null)
    .eq('product_type', type);

  if (error) {
    console.error('Failed to count products by type:', error);
    return 0;
  }
  return count ?? 0;
}

// ============================================================================
// Year Facet Queries
// ============================================================================

export async function getProductsByYear(
  year: number
): Promise<ProductListItem[]> {
  const { data, error } = await baseProductQuery()
    .eq('year', year);

  if (error) {
    console.error('Failed to fetch products by year:', error);
    return [];
  }
  return data ?? [];
}

export async function getAvailableYears(): Promise<number[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('year')
    .eq('is_public', true)
    .is('deleted_at', null)
    .not('year', 'is', null)
    .order('year', { ascending: false });

  if (error) {
    console.error('Failed to fetch available years:', error);
    return [];
  }

  // Extract unique years
  const years = [...new Set(data?.map((p) => p.year).filter(Boolean))] as number[];
  return years.sort((a, b) => b - a); // Descending order
}

export async function getProductCountByYear(
  year: number
): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
    .is('deleted_at', null)
    .eq('year', year);

  if (error) {
    console.error('Failed to count products by year:', error);
    return 0;
  }
  return count ?? 0;
}

// ============================================================================
// Price Range Facet Queries
// ============================================================================

export async function getProductsByPriceRange(
  rangeSlug: string
): Promise<ProductListItem[]> {
  const range = getPriceRange(rangeSlug);
  if (!range) return [];

  let query = baseProductQuery();

  if (range.minPrice !== null) {
    query = query.gte('price', range.minPrice);
  }
  if (range.maxPrice !== null) {
    query = query.lt('price', range.maxPrice);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch products by price range:', error);
    return [];
  }
  return data ?? [];
}

export async function getProductCountByPriceRange(
  range: PriceRange
): Promise<number> {
  const supabase = createPublicClient();
  let query = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
    .is('deleted_at', null);

  if (range.minPrice !== null) {
    query = query.gte('price', range.minPrice);
  }
  if (range.maxPrice !== null) {
    query = query.lt('price', range.maxPrice);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Failed to count products by price range:', error);
    return 0;
  }
  return count ?? 0;
}

// ============================================================================
// Size (Shipping Size) Facet Queries
// ============================================================================

export async function getProductsBySize(
  sizeSlug: string,
  locale: Locale
): Promise<ProductListItem[]> {
  const sizeValue = getSizeValueFromSlug(sizeSlug, locale);
  if (!sizeValue) return [];

  const { data, error } = await baseProductQuery()
    .eq('shipping_size', sizeValue);

  if (error) {
    console.error('Failed to fetch products by size:', error);
    return [];
  }
  return data ?? [];
}

export async function getProductCountBySize(
  size: ShippingSize
): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
    .is('deleted_at', null)
    .eq('shipping_size', size);

  if (error) {
    console.error('Failed to count products by size:', error);
    return 0;
  }
  return count ?? 0;
}

// ============================================================================
// Combined Facet Queries (Type + Year)
// ============================================================================

export async function getProductsByTypeAndYear(
  typeSlug: string,
  year: number,
  locale: Locale
): Promise<ProductListItem[]> {
  const typeValue = getTypeValueFromSlug(typeSlug, locale);
  if (!typeValue) return [];

  const { data, error } = await baseProductQuery()
    .eq('product_type', typeValue)
    .eq('year', year);

  if (error) {
    console.error('Failed to fetch products by type and year:', error);
    return [];
  }
  return data ?? [];
}

export async function getProductCountByTypeAndYear(
  type: TypeFacetValue,
  year: number
): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
    .is('deleted_at', null)
    .eq('product_type', type)
    .eq('year', year);

  if (error) {
    console.error('Failed to count products by type and year:', error);
    return 0;
  }
  return count ?? 0;
}

export async function getAvailableYearsForType(
  type: TypeFacetValue
): Promise<number[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('year')
    .eq('is_public', true)
    .is('deleted_at', null)
    .eq('product_type', type)
    .not('year', 'is', null)
    .order('year', { ascending: false });

  if (error) {
    console.error('Failed to fetch years for type:', error);
    return [];
  }

  const years = [...new Set(data?.map((p) => p.year).filter(Boolean))] as number[];
  return years.sort((a, b) => b - a);
}

// ============================================================================
// Facet Counts for Navigation
// ============================================================================

export interface FacetCounts {
  types: Record<TypeFacetValue, number>;
  sizes: Record<ShippingSize, number>;
  years: Record<number, number>;
  priceRanges: Record<string, number>;
}

export async function getAllFacetCounts(): Promise<FacetCounts> {
  const supabase = createPublicClient();

  // Fetch all products with relevant fields for counting
  const { data: products, error } = await supabase
    .from('products')
    .select('product_type, shipping_size, year, price')
    .eq('is_public', true)
    .is('deleted_at', null);

  if (error || !products) {
    console.error('Failed to fetch facet counts:', error);
    return {
      types: { original: 0, print: 0 },
      sizes: { small: 0, medium: 0, large: 0, oversized: 0 },
      years: {},
      priceRanges: {},
    };
  }

  // Count by type
  const types: Record<TypeFacetValue, number> = { original: 0, print: 0 };
  const sizes: Record<ShippingSize, number> = { small: 0, medium: 0, large: 0, oversized: 0 };
  const years: Record<number, number> = {};
  const priceRanges: Record<string, number> = {
    'under-2500': 0,
    '2500-5000': 0,
    '5000-10000': 0,
    '10000-25000': 0,
    'over-25000': 0,
  };

  for (const product of products) {
    // Type counts
    if (product.product_type in types) {
      types[product.product_type as TypeFacetValue]++;
    }

    // Size counts
    if (product.shipping_size && product.shipping_size in sizes) {
      sizes[product.shipping_size as ShippingSize]++;
    }

    // Year counts
    if (product.year) {
      years[product.year] = (years[product.year] || 0) + 1;
    }

    // Price range counts
    const price = product.price;
    if (price < 250000) {
      priceRanges['under-2500']++;
    } else if (price < 500000) {
      priceRanges['2500-5000']++;
    } else if (price < 1000000) {
      priceRanges['5000-10000']++;
    } else if (price < 2500000) {
      priceRanges['10000-25000']++;
    } else {
      priceRanges['over-25000']++;
    }
  }

  return { types, sizes, years, priceRanges };
}

// ============================================================================
// Sitemap Queries
// ============================================================================

export interface SitemapProduct {
  slug: string;
  updated_at: string | null;
  product_type: 'original' | 'print';
  year: number | null;
  shipping_size: ShippingSize | null;
  price: number;
}

export async function getAllProductsForSitemap(): Promise<SitemapProduct[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('slug, updated_at, product_type, year, shipping_size, price')
    .eq('is_public', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to fetch products for sitemap:', error);
    return [];
  }
  return data ?? [];
}

export interface SitemapCollection {
  slug: string;
  updated_at: string | null;
}

export async function getAllCollectionsForSitemap(): Promise<SitemapCollection[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('collections')
    .select('slug, updated_at')
    .eq('is_public', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to fetch collections for sitemap:', error);
    return [];
  }
  return data ?? [];
}
