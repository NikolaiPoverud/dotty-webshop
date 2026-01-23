import type { MetadataRoute } from 'next';
import {
  buildSitemapUrl,
  calculateProductChunks,
  getAllSegments,
  type SitemapSegment,
} from './segments';
import { getProductCount } from './url-generators';

export * from './segments';
export * from './url-generators';

export interface SitemapIndexEntry {
  url: string;
  lastModified?: Date;
}

export async function generateSitemapIndex(
  baseUrl: string
): Promise<SitemapIndexEntry[]> {
  const now = new Date();
  const entries: SitemapIndexEntry[] = [
    { url: `${baseUrl}${buildSitemapUrl('static')}`, lastModified: now },
    { url: `${baseUrl}${buildSitemapUrl('collections')}`, lastModified: now },
    { url: `${baseUrl}${buildSitemapUrl('facets')}`, lastModified: now },
    { url: `${baseUrl}${buildSitemapUrl('paginated')}`, lastModified: now },
  ];

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

export function isValidSegment(segment: string): segment is SitemapSegment {
  const validSegments = getAllSegments();
  return validSegments.includes(segment as SitemapSegment);
}

export function parseSegmentFromPath(path: string): {
  segment: SitemapSegment;
  chunk?: number;
} | null {
  const match = path.match(/^([a-z]+)(?:-(\d+))?$/);
  if (!match) return null;

  const [, segmentName, chunkStr] = match;
  if (!isValidSegment(segmentName)) return null;

  return {
    segment: segmentName,
    chunk: chunkStr ? parseInt(chunkStr, 10) : undefined,
  };
}

export interface SitemapStats {
  totalUrls: number;
  segments: Record<SitemapSegment, number>;
  productChunks: number;
}

export async function getSitemapStats(): Promise<SitemapStats> {
  const productCount = await getProductCount();
  const productChunks = calculateProductChunks(productCount);
  const productUrls = productCount * 2;

  return {
    totalUrls: productUrls,
    segments: {
      static: 16,
      products: productUrls,
      collections: 0,
      facets: 0,
      paginated: 0,
    },
    productChunks,
  };
}
