import 'server-only';

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { ProductListItem, Product, Collection, Locale, ShippingSize } from '@/types';
import {
  getOrSetCached,
  cacheKeys,
  CACHE_TTL,
} from '@/lib/cache/kv-cache';

/**
 * Creates a Supabase client with Next.js fetch caching enabled
 * Used for read-only public data that can be cached at the edge
 */
function createCachedPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase public credentials');
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      // Enable Next.js fetch caching with revalidation
      fetch: (url, options) => fetch(url, {
        ...options,
        next: { revalidate: 60 }, // Revalidate every 60 seconds
      }),
    },
  });
}

// Common columns for product list queries - must match ProductListItem type
export const PRODUCT_LIST_COLUMNS = 'id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry, year, shipping_size';

// Full product columns including description
const PRODUCT_FULL_COLUMNS = '*, collection:collections(id, name, slug)';

// ============================================================================
// Cached Product Queries
// ============================================================================

/**
 * Get a single product by slug with distributed caching
 */
export async function getCachedProduct(slug: string): Promise<Product | null> {
  return getOrSetCached(
    cacheKeys.product(slug),
    async () => {
      const supabase = createCachedPublicClient();
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_FULL_COLUMNS)
        .eq('slug', slug)
        .eq('is_public', true)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Failed to fetch product:', error);
        return null;
      }
      return data;
    },
    CACHE_TTL.product
  );
}

/**
 * Get featured products with caching
 */
export const getCachedFeaturedProducts = unstable_cache(
  async (): Promise<ProductListItem[]> => {
    const supabase = createCachedPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS)
      .eq('is_public', true)
      .eq('is_featured', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .limit(12);

    if (error) {
      console.error('Failed to fetch featured products:', error);
      return [];
    }
    return data ?? [];
  },
  ['featured-products'],
  { revalidate: 300, tags: ['products'] }
);

/**
 * Get products by type with caching
 */
export const getCachedProductsByType = unstable_cache(
  async (type: 'original' | 'print'): Promise<ProductListItem[]> => {
    const supabase = createCachedPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS)
      .eq('is_public', true)
      .eq('product_type', type)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch products by type:', error);
      return [];
    }
    return data ?? [];
  },
  ['products-by-type'],
  { revalidate: 300, tags: ['products'] }
);

/**
 * Get products by year with caching
 */
export const getCachedProductsByYear = unstable_cache(
  async (year: number): Promise<ProductListItem[]> => {
    const supabase = createCachedPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS)
      .eq('is_public', true)
      .eq('year', year)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch products by year:', error);
      return [];
    }
    return data ?? [];
  },
  ['products-by-year'],
  { revalidate: 300, tags: ['products'] }
);

/**
 * Get products by size with caching
 */
export const getCachedProductsBySize = unstable_cache(
  async (size: ShippingSize): Promise<ProductListItem[]> => {
    const supabase = createCachedPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS)
      .eq('is_public', true)
      .eq('shipping_size', size)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch products by size:', error);
      return [];
    }
    return data ?? [];
  },
  ['products-by-size'],
  { revalidate: 300, tags: ['products'] }
);

/**
 * Get products by price range with caching
 */
export const getCachedProductsByPriceRange = unstable_cache(
  async (minPrice: number | null, maxPrice: number | null): Promise<ProductListItem[]> => {
    const supabase = createCachedPublicClient();
    let query = supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS)
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('price', { ascending: true });

    if (minPrice !== null) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== null) {
      query = query.lt('price', maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch products by price range:', error);
      return [];
    }
    return data ?? [];
  },
  ['products-by-price'],
  { revalidate: 300, tags: ['products'] }
);

/**
 * Get products by type and year with caching
 */
export const getCachedProductsByTypeAndYear = unstable_cache(
  async (type: 'original' | 'print', year: number): Promise<ProductListItem[]> => {
    const supabase = createCachedPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS)
      .eq('is_public', true)
      .eq('product_type', type)
      .eq('year', year)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch products by type and year:', error);
      return [];
    }
    return data ?? [];
  },
  ['products-by-type-year'],
  { revalidate: 300, tags: ['products'] }
);

// ============================================================================
// Cached Facet Counts (using materialized view when available)
// ============================================================================

export interface CachedFacetCounts {
  types: Record<string, number>;
  sizes: Record<ShippingSize, number>;
  years: Record<number, number>;
  priceRanges: Record<string, number>;
}

/**
 * Get all facet counts with distributed caching
 * Uses materialized view for optimal performance
 */
export async function getCachedFacetCounts(): Promise<CachedFacetCounts> {
  return getOrSetCached(
    cacheKeys.facetCounts(),
    async () => {
      const supabase = createCachedPublicClient();

      // Try materialized view first
      const { data: viewData, error: viewError } = await supabase
        .from('facet_product_counts')
        .select('*');

      if (!viewError && viewData && viewData.length > 0) {
        return parseFacetCountsFromView(viewData);
      }

      // Fallback to direct count from products table
      console.warn('Materialized view not available, using direct count');
      return getDirectFacetCounts();
    },
    CACHE_TTL.facetCounts
  );
}

function parseFacetCountsFromView(
  data: Array<{
    product_type: string | null;
    year: number | null;
    shipping_size: string | null;
    price_range: string | null;
    collection_id: string | null;
    product_count: number;
  }>
): CachedFacetCounts {
  const counts: CachedFacetCounts = {
    types: { original: 0, print: 0 },
    sizes: { small: 0, medium: 0, large: 0, oversized: 0 },
    years: {},
    priceRanges: {
      'under-2500': 0,
      '2500-5000': 0,
      '5000-10000': 0,
      '10000-25000': 0,
      'over-25000': 0,
    },
  };

  for (const row of data) {
    // Type counts (single-dimension rows)
    if (row.product_type && !row.year && !row.shipping_size && !row.price_range && !row.collection_id) {
      counts.types[row.product_type] = row.product_count;
    }

    // Year counts
    if (row.year && !row.product_type && !row.shipping_size && !row.price_range && !row.collection_id) {
      counts.years[row.year] = row.product_count;
    }

    // Size counts
    if (row.shipping_size && !row.product_type && !row.year && !row.price_range && !row.collection_id) {
      counts.sizes[row.shipping_size as ShippingSize] = row.product_count;
    }

    // Price range counts
    if (row.price_range && !row.product_type && !row.year && !row.shipping_size && !row.collection_id) {
      counts.priceRanges[row.price_range] = row.product_count;
    }
  }

  return counts;
}

async function getDirectFacetCounts(): Promise<CachedFacetCounts> {
  const supabase = createCachedPublicClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('product_type, shipping_size, year, price')
    .eq('is_public', true)
    .is('deleted_at', null);

  if (error || !products) {
    console.error('Failed to fetch direct facet counts:', error);
    return {
      types: { original: 0, print: 0 },
      sizes: { small: 0, medium: 0, large: 0, oversized: 0 },
      years: {},
      priceRanges: {},
    };
  }

  const counts: CachedFacetCounts = {
    types: { original: 0, print: 0 },
    sizes: { small: 0, medium: 0, large: 0, oversized: 0 },
    years: {},
    priceRanges: {
      'under-2500': 0,
      '2500-5000': 0,
      '5000-10000': 0,
      '10000-25000': 0,
      'over-25000': 0,
    },
  };

  for (const product of products) {
    if (product.product_type) {
      counts.types[product.product_type] = (counts.types[product.product_type] || 0) + 1;
    }

    if (product.shipping_size) {
      counts.sizes[product.shipping_size as ShippingSize] = (counts.sizes[product.shipping_size as ShippingSize] || 0) + 1;
    }

    if (product.year) {
      counts.years[product.year] = (counts.years[product.year] || 0) + 1;
    }

    const price = product.price;
    if (price < 250000) {
      counts.priceRanges['under-2500']++;
    } else if (price < 500000) {
      counts.priceRanges['2500-5000']++;
    } else if (price < 1000000) {
      counts.priceRanges['5000-10000']++;
    } else if (price < 2500000) {
      counts.priceRanges['10000-25000']++;
    } else {
      counts.priceRanges['over-25000']++;
    }
  }

  return counts;
}

/**
 * Get available years with caching
 */
export async function getCachedAvailableYears(): Promise<number[]> {
  return getOrSetCached(
    cacheKeys.availableYears(),
    async () => {
      const supabase = createCachedPublicClient();
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

      const years = [...new Set(data?.map((p) => p.year).filter(Boolean))] as number[];
      return years.sort((a, b) => b - a);
    },
    CACHE_TTL.availableYears
  );
}

// ============================================================================
// Cached Collection Queries
// ============================================================================

/**
 * Get all collections with caching
 */
export const getCachedCollections = unstable_cache(
  async (): Promise<Collection[]> => {
    const supabase = createCachedPublicClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch collections:', error);
      return [];
    }
    return data ?? [];
  },
  ['collections'],
  { revalidate: 3600, tags: ['collections'] }
);

/**
 * Get a single collection by slug with distributed caching
 */
export async function getCachedCollection(slug: string): Promise<Collection | null> {
  return getOrSetCached(
    cacheKeys.collection(slug),
    async () => {
      const supabase = createCachedPublicClient();
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Failed to fetch collection:', error);
        return null;
      }
      return data;
    },
    CACHE_TTL.collections
  );
}

// ============================================================================
// Cached SEO Content Templates
// ============================================================================

export interface SeoContentTemplate {
  id: string;
  locale: string;
  facet_type: string;
  facet_value: string;
  meta_title: string;
  meta_description: string;
  h1_text: string;
  intro_paragraph: string | null;
  seo_footer_text: string | null;
  faq_items: Array<{ question: string; answer: string }>;
  low_count_intro: string | null;
  high_count_intro: string | null;
  empty_state_text: string | null;
}

/**
 * Get SEO content template with distributed caching
 */
export async function getCachedSeoTemplate(
  locale: Locale,
  facetType: string,
  facetValue: string
): Promise<SeoContentTemplate | null> {
  return getOrSetCached(
    cacheKeys.seoTemplate(locale, facetType, facetValue),
    async () => {
      const supabase = createCachedPublicClient();
      const { data, error } = await supabase
        .from('seo_content_templates')
        .select('*')
        .eq('locale', locale)
        .eq('facet_type', facetType)
        .eq('facet_value', facetValue)
        .single();

      if (error) {
        // Template not found is expected for some facets
        if (error.code !== 'PGRST116') {
          console.error('Failed to fetch SEO template:', error);
        }
        return null;
      }
      return data;
    },
    CACHE_TTL.seoTemplate
  );
}

// ============================================================================
// Sitemap Data
// ============================================================================

export interface SitemapProduct {
  slug: string;
  updated_at: string | null;
  product_type: 'original' | 'print';
  year: number | null;
  shipping_size: ShippingSize | null;
  price: number;
}

/**
 * Get all products for sitemap with caching
 */
export async function getCachedProductsForSitemap(): Promise<SitemapProduct[]> {
  return getOrSetCached(
    cacheKeys.sitemapSlugs('products'),
    async () => {
      const supabase = createCachedPublicClient();
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
    },
    CACHE_TTL.sitemapSlugs
  );
}

export interface SitemapCollection {
  slug: string;
  updated_at: string | null;
}

/**
 * Get all collections for sitemap with caching
 */
export async function getCachedCollectionsForSitemap(): Promise<SitemapCollection[]> {
  return getOrSetCached(
    cacheKeys.sitemapSlugs('collections'),
    async () => {
      const supabase = createCachedPublicClient();
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
    },
    CACHE_TTL.sitemapSlugs
  );
}
