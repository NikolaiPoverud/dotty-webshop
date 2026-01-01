import { createAdminClient } from '@/lib/supabase/admin';
import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updated_at: string | null }[] = [];
  let collections: { slug: string; updated_at: string | null }[] = [];

  try {
    const supabase = createAdminClient();

    // Fetch all available products
    const { data: productsData } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_available', true);

    // Fetch all collections
    const { data: collectionsData } = await supabase
      .from('collections')
      .select('slug, updated_at');

    products = productsData || [];
    collections = collectionsData || [];
  } catch (error) {
    console.warn('Could not fetch data for sitemap:', error);
  }

  const now = new Date();

  // Product URLs for both languages
  const productUrls = (products || []).flatMap((product) => [
    {
      url: `${BASE_URL}/no/shop/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/shop/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  // Collection URLs (if you have collection pages)
  const collectionUrls = (collections || []).flatMap((collection) => [
    {
      url: `${BASE_URL}/no/shop?collection=${collection.slug}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]);

  return [
    // Homepage - highest priority
    {
      url: `${BASE_URL}/no`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },

    // Shop pages
    {
      url: `${BASE_URL}/no/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/en/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },

    // Sold artworks
    {
      url: `${BASE_URL}/no/solgt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/en/sold`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
    },

    // Products
    ...productUrls,

    // Collections
    ...collectionUrls,

    // Legal pages
    {
      url: `${BASE_URL}/no/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/no/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
