import type { Locale } from '@/types';
import { SEO_CONFIG, SEO_TEMPLATES, PageType } from '../config';

export const MAX_URLS_PER_SEGMENT = 10000;

export type SitemapSegment =
  | 'static'       // Home, about, privacy, terms, contact, FAQ
  | 'products'     // All product pages (chunked if needed)
  | 'collections'  // All collection pages
  | 'facets'       // All faceted pages (type, year, price, size)
  | 'paginated';   // Paginated listing pages

export interface SegmentConfig {
  segment: SitemapSegment;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  revalidate: number;
}

export const SEGMENT_CONFIGS: Record<SitemapSegment, SegmentConfig> = {
  static: {
    segment: 'static',
    priority: 0.8,
    changeFrequency: 'monthly',
    revalidate: 86400, // 24 hours
  },
  products: {
    segment: 'products',
    priority: 0.8,
    changeFrequency: 'weekly',
    revalidate: 3600, // 1 hour
  },
  collections: {
    segment: 'collections',
    priority: 0.85,
    changeFrequency: 'weekly',
    revalidate: 3600, // 1 hour
  },
  facets: {
    segment: 'facets',
    priority: 0.7,
    changeFrequency: 'weekly',
    revalidate: 3600, // 1 hour
  },
  paginated: {
    segment: 'paginated',
    priority: 0.5,
    changeFrequency: 'weekly',
    revalidate: 3600,
  },
};

export interface StaticPage {
  path: string;
  pathEn?: string; // Optional different English path
  priority: number;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const STATIC_PAGES: StaticPage[] = [
  { path: '', priority: 1.0, changeFrequency: 'daily' },           // Home
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },       // Shop
  { path: '/solgt', pathEn: '/sold', priority: 0.5, changeFrequency: 'weekly' }, // Sold
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },    // About
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },      // FAQ
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },  // Contact
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },   // Privacy
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/guide', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guide/hva-er-pop-art', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guide/velg-kunst-til-hjemmet', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guide/ta-vare-pa-kunsttrykk', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guide/pop-art-historie', priority: 0.7, changeFrequency: 'monthly' },
];

export interface FacetSegmentDef {
  type: 'type' | 'year' | 'price' | 'size' | 'type-year';
  basePath: string;
  priority: number;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
}

export const FACET_SEGMENTS: FacetSegmentDef[] = [
  { type: 'type', basePath: '/shop/type', priority: 0.85, changeFrequency: 'weekly' },
  { type: 'year', basePath: '/shop/year', priority: 0.7, changeFrequency: 'weekly' },
  { type: 'price', basePath: '/shop/price', priority: 0.6, changeFrequency: 'weekly' },
  { type: 'size', basePath: '/shop/size', priority: 0.6, changeFrequency: 'weekly' },
  { type: 'type-year', basePath: '/shop/type', priority: 0.65, changeFrequency: 'weekly' },
];

export function getAllSegments(): SitemapSegment[] {
  return Object.keys(SEGMENT_CONFIGS) as SitemapSegment[];
}

export function getSegmentConfig(segment: SitemapSegment): SegmentConfig {
  return SEGMENT_CONFIGS[segment];
}

export function getDomainForLocale(locale: Locale): string {
  return SEO_CONFIG.domains[locale];
}

export function buildSitemapUrl(segment: SitemapSegment, chunk?: number): string {
  const base = `/sitemap/${segment}`;
  if (chunk !== undefined && chunk > 1) {
    return `${base}-${chunk}/sitemap.xml`;
  }
  return `${base}/sitemap.xml`;
}

export function buildSitemapIndexUrls(): Array<{ url: string; lastModified: Date }> {
  const now = new Date();
  const segments = getAllSegments();

  return segments.map((segment) => ({
    url: buildSitemapUrl(segment),
    lastModified: now,
  }));
}

// Calculate number of product chunks needed
export function calculateProductChunks(productCount: number): number {
  return Math.ceil(productCount / MAX_URLS_PER_SEGMENT);
}

// Get page type config for sitemap
export function getPageTypeConfig(pageType: PageType): {
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
} {
  const template = SEO_TEMPLATES[pageType];
  return {
    priority: template.priority,
    changeFrequency: template.changeFrequency,
  };
}
