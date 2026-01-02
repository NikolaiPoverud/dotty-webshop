import { createAdminClient } from '@/lib/supabase/admin';
import type { MetadataRoute } from 'next';

// Domain configuration for sitemap
const DOMAIN_NO = process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no';
const DOMAIN_EN = process.env.NEXT_PUBLIC_DOMAIN_EN || 'https://dottyartwork.com';

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

  // Product URLs for both domains/languages
  const productUrls = (products || []).flatMap((product) => [
    {
      url: `${DOMAIN_NO}/no/shop/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${DOMAIN_EN}/en/shop/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  // Collection URLs
  const collectionUrls = (collections || []).flatMap((collection) => [
    {
      url: `${DOMAIN_NO}/no/shop?collection=${collection.slug}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${DOMAIN_EN}/en/shop?collection=${collection.slug}`,
      lastModified: collection.updated_at ? new Date(collection.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ]);

  return [
    // Homepage - highest priority (Norwegian on dotty.no)
    {
      url: `${DOMAIN_NO}/no`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // English homepage on dottyartwork.com
    {
      url: `${DOMAIN_EN}/en`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // Shop pages
    {
      url: `${DOMAIN_NO}/no/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${DOMAIN_EN}/en/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },

    // Sold artworks
    {
      url: `${DOMAIN_NO}/no/solgt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${DOMAIN_EN}/en/sold`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },

    // Products
    ...productUrls,

    // Collections
    ...collectionUrls,

    // Legal pages (both languages)
    {
      url: `${DOMAIN_NO}/no/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${DOMAIN_NO}/no/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${DOMAIN_EN}/en/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${DOMAIN_EN}/en/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
