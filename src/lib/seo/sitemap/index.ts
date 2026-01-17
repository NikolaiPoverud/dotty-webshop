/**
 * Sitemap Infrastructure
 *
 * Central module for sitemap generation supporting 100k+ pages.
 * Uses a sitemap index pattern with segmented sitemaps.
 */

export * from './segments';
export * from './url-generators';

import type { MetadataRoute } from 'next';
import {
  getAllSegments,
  buildSitemapUrl,
  calculateProductChunks,
  type SitemapSegment,
} from './segments';
import { getProductCount } from './url-generators';

// ============================================================================
// Sitemap Index Generation
// ============================================================================

export interface SitemapIndexEntry {
  url: string;
  lastModified?: Date;
}

/**
 * Generate the sitemap index that lists all sitemap segments
 */
export async function generateSitemapIndex(
  baseUrl: string
): Promise<SitemapIndexEntry[]> {
  const now = new Date();
  const entries: SitemapIndexEntry[] = [];

  // Add static segment
  entries.push({
    url: `${baseUrl}${buildSitemapUrl('static')}`,
    lastModified: now,
  });

  // Add collections segment
  entries.push({
    url: `${baseUrl}${buildSitemapUrl('collections')}`,
    lastModified: now,
  });

  // Add facets segment
  entries.push({
    url: `${baseUrl}${buildSitemapUrl('facets')}`,
    lastModified: now,
  });

  // Add paginated segment
  entries.push({
    url: `${baseUrl}${buildSitemapUrl('paginated')}`,
    lastModified: now,
  });

  // Add product segments (may be chunked)
  const productCount = await getProductCount();
  const chunks = calculateProductChunks(productCount);

  for (let i = 1; i <= chunks; i++) {
    entries.push({
      url: `${baseUrl}${buildSitemapUrl('products', i)}`,
      lastModified: now,
    });
  }

  return entries;
}

/**
 * Generate XML string for sitemap index
 */
export function generateSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const urlsXml = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>`
        : '';
      return `  <sitemap>
    <loc>${entry.url}</loc>
    ${lastModified}
  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</sitemapindex>`;
}

/**
 * Generate XML string for a sitemap
 */
export function generateSitemapXml(entries: MetadataRoute.Sitemap): string {
  const urlsXml = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
        : '';
      const changeFreq = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : '';
      const priority = entry.priority !== undefined
        ? `<priority>${entry.priority.toFixed(1)}</priority>`
        : '';

      return `  <url>
    <loc>${entry.url}</loc>
    ${lastModified}
    ${changeFreq}
    ${priority}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function isValidSegment(segment: string): segment is SitemapSegment {
  const validSegments = getAllSegments();
  return validSegments.includes(segment as SitemapSegment);
}

export function parseSegmentFromPath(path: string): {
  segment: SitemapSegment;
  chunk?: number;
} | null {
  // Match patterns like "products", "products-2", "static"
  const match = path.match(/^([a-z]+)(?:-(\d+))?$/);
  if (!match) return null;

  const [, segmentName, chunkStr] = match;
  if (!isValidSegment(segmentName)) return null;

  return {
    segment: segmentName,
    chunk: chunkStr ? parseInt(chunkStr, 10) : undefined,
  };
}

// ============================================================================
// Statistics
// ============================================================================

export interface SitemapStats {
  totalUrls: number;
  segments: Record<SitemapSegment, number>;
  productChunks: number;
}

export async function getSitemapStats(): Promise<SitemapStats> {
  const productCount = await getProductCount();
  const productChunks = calculateProductChunks(productCount);

  // Estimate URL counts (product count × 2 for both locales)
  const productUrls = productCount * 2;

  return {
    totalUrls: productUrls, // This is an estimate, actual count requires running all generators
    segments: {
      static: 16, // 8 static pages × 2 locales
      products: productUrls,
      collections: 0, // Would need to query
      facets: 0, // Would need to calculate
      paginated: 0, // Would need to calculate
    },
    productChunks,
  };
}
