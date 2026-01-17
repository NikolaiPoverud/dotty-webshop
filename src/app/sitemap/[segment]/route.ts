/**
 * Dynamic Sitemap Segment Route
 *
 * Handles requests for individual sitemap segments:
 * - /sitemap/static/sitemap.xml
 * - /sitemap/products/sitemap.xml
 * - /sitemap/products-2/sitemap.xml (for chunked products)
 * - /sitemap/collections/sitemap.xml
 * - /sitemap/facets/sitemap.xml
 * - /sitemap/paginated/sitemap.xml
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  parseSegmentFromPath,
  generateSitemapXml,
  generateSitemapForSegment,
  getSegmentConfig,
} from '@/lib/seo/sitemap';

// Revalidate every hour
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segment: string }> }
): Promise<NextResponse> {
  const { segment: segmentPath } = await context.params;

  // Parse segment from path (handles "products", "products-2", etc.)
  const parsed = parseSegmentFromPath(segmentPath);

  if (!parsed) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { segment, chunk } = parsed;

  try {
    // Generate sitemap entries for this segment
    const entries = await generateSitemapForSegment(segment, chunk);

    // Generate XML
    const xml = generateSitemapXml(entries);

    // Get revalidation config for this segment
    const config = getSegmentConfig(segment);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, s-maxage=${config.revalidate}, stale-while-revalidate=${config.revalidate * 2}`,
      },
    });
  } catch (error) {
    console.error(`Failed to generate sitemap for segment ${segment}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
