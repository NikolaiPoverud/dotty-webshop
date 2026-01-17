/**
 * Sitemap Index
 *
 * Generates a sitemap index that points to segmented sitemaps.
 * This pattern supports 100k+ pages by splitting URLs across multiple sitemaps.
 *
 * Sitemap segments:
 * - /sitemap/static/sitemap.xml - Static pages (home, about, privacy, terms)
 * - /sitemap/products/sitemap.xml - Product pages (chunked if needed)
 * - /sitemap/collections/sitemap.xml - Collection pages
 * - /sitemap/facets/sitemap.xml - Faceted pages (type, year, price, size)
 * - /sitemap/paginated/sitemap.xml - Paginated listing pages
 */

import type { MetadataRoute } from 'next';
import { generateSitemapIndex, type SitemapIndexEntry } from '@/lib/seo/sitemap';

const DOMAIN_NO = process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no';

// Revalidate every hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Generate sitemap index entries
    const indexEntries: SitemapIndexEntry[] = await generateSitemapIndex(DOMAIN_NO);

    // Convert to Next.js sitemap format
    // Note: Next.js sitemap() doesn't natively support sitemap index format,
    // but we return the sitemaps as URLs so crawlers can discover them
    return indexEntries.map((entry) => ({
      url: entry.url,
      lastModified: entry.lastModified,
    }));
  } catch (error) {
    console.error('Failed to generate sitemap index:', error);

    // Fallback: Return basic sitemap with main pages
    const now = new Date();
    return [
      { url: `${DOMAIN_NO}/sitemap/static/sitemap.xml`, lastModified: now },
      { url: `${DOMAIN_NO}/sitemap/products/sitemap.xml`, lastModified: now },
      { url: `${DOMAIN_NO}/sitemap/collections/sitemap.xml`, lastModified: now },
      { url: `${DOMAIN_NO}/sitemap/facets/sitemap.xml`, lastModified: now },
    ];
  }
}
