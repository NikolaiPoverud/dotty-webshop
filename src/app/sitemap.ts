import type { MetadataRoute } from 'next';

import { createAdminClient } from '@/lib/supabase/admin';

const DOMAIN_NO = process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no';
const DOMAIN_EN = process.env.NEXT_PUBLIC_DOMAIN_EN || 'https://dottyartwork.com';

interface SitemapItem {
  slug: string;
  updated_at: string | null;
}

function createLocalizedUrls(
  path: string,
  lastModified: Date,
  changeFrequency: 'daily' | 'weekly' | 'monthly',
  priorityNo: number,
  priorityEn: number
): MetadataRoute.Sitemap {
  return [
    { url: `${DOMAIN_NO}/no${path}`, lastModified, changeFrequency, priority: priorityNo },
    { url: `${DOMAIN_EN}/en${path}`, lastModified, changeFrequency, priority: priorityEn },
  ];
}

function createItemUrls(
  items: SitemapItem[],
  pathPrefix: string,
  now: Date,
  priorityNo: number,
  priorityEn: number
): MetadataRoute.Sitemap {
  return items.flatMap((item) => {
    const lastModified = item.updated_at ? new Date(item.updated_at) : now;
    return createLocalizedUrls(`${pathPrefix}/${item.slug}`, lastModified, 'weekly', priorityNo, priorityEn);
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: SitemapItem[] = [];
  let collections: SitemapItem[] = [];

  try {
    const supabase = createAdminClient();

    const [productsResult, collectionsResult] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('is_available', true),
      supabase.from('collections').select('slug, updated_at'),
    ]);

    products = productsResult.data ?? [];
    collections = collectionsResult.data ?? [];
  } catch (error) {
    console.warn('Could not fetch data for sitemap:', error);
  }

  const now = new Date();

  return [
    ...createLocalizedUrls('', now, 'daily', 1.0, 1.0),
    ...createLocalizedUrls('/shop', now, 'daily', 0.9, 0.9),
    { url: `${DOMAIN_NO}/no/solgt`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${DOMAIN_EN}/en/sold`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    ...createItemUrls(products, '/shop', now, 0.8, 0.7),
    ...createItemUrls(collections, '/shop', now, 0.8, 0.7),
    ...createLocalizedUrls('/privacy', now, 'monthly', 0.3, 0.3),
    ...createLocalizedUrls('/terms', now, 'monthly', 0.3, 0.3),
  ];
}
