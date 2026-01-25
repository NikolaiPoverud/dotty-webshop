import 'server-only';

import type { MetadataRoute } from 'next';
import type { Locale } from '@/types';
import {
  getCachedProductsForSitemap,
  getCachedCollectionsForSitemap,
  getCachedFacetCounts,
  getCachedAvailableYears,
} from '@/lib/supabase/cached-public';
import {
  kvGet,
  cacheKeys,
} from '@/lib/cache/kv-cache';
import {
  STATIC_PAGES,
  MAX_URLS_PER_SEGMENT,
  getDomainForLocale,
  getPageTypeConfig,
} from './segments';
import {
  TYPE_FACET_SLUGS,
  SIZE_FACET_SLUGS,
  PRICE_RANGES,
  type TypeFacetValue,
} from '../facets';
import { MIN_PRODUCTS_FOR_INDEX } from '../facets';

type SitemapEntry = MetadataRoute.Sitemap[number];

function createLocalizedEntry(
  path: string,
  locale: Locale,
  lastModified: Date,
  changeFrequency: SitemapEntry['changeFrequency'],
  priority: number,
  pathOverride?: string
): SitemapEntry {
  const domain = getDomainForLocale(locale);
  const finalPath = pathOverride || path;
  return {
    url: `${domain}/${locale}${finalPath}`,
    lastModified,
    changeFrequency,
    priority,
  };
}

function createBothLocaleEntries(
  path: string,
  lastModified: Date,
  changeFrequency: SitemapEntry['changeFrequency'],
  priority: number,
  pathEnOverride?: string
): SitemapEntry[] {
  return [
    createLocalizedEntry(path, 'no', lastModified, changeFrequency, priority),
    createLocalizedEntry(pathEnOverride || path, 'en', lastModified, changeFrequency, priority),
  ];
}

export async function generateStaticSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: SitemapEntry[] = [];

  for (const page of STATIC_PAGES) {
    const enPath = page.pathEn || page.path;
    entries.push(...createBothLocaleEntries(
      page.path,
      now,
      page.changeFrequency,
      page.priority,
      enPath
    ));
  }

  return entries;
}

export async function generateProductsSitemap(
  chunk: number = 1
): Promise<MetadataRoute.Sitemap> {
  // Use cached products for sitemap
  const allProducts = await getCachedProductsForSitemap();

  // Sort by slug for consistent ordering and slice for pagination
  const sortedProducts = [...allProducts].sort((a, b) => a.slug.localeCompare(b.slug));
  const offset = (chunk - 1) * MAX_URLS_PER_SEGMENT;
  const products = sortedProducts.slice(offset, offset + MAX_URLS_PER_SEGMENT);

  const config = getPageTypeConfig('product');
  const entries: SitemapEntry[] = [];

  for (const product of products) {
    const lastModified = product.updated_at ? new Date(product.updated_at) : new Date();
    entries.push(...createBothLocaleEntries(
      `/shop/${product.slug}`,
      lastModified,
      config.changeFrequency,
      config.priority
    ));
  }

  return entries;
}

export async function getProductCount(): Promise<number> {
  // Try to get cached count first (from precompute cron)
  const cachedCount = await kvGet<number>(cacheKeys.sitemapSlugs('product-count'));
  if (cachedCount !== null) {
    return cachedCount;
  }

  // Fallback to counting from cached products
  const products = await getCachedProductsForSitemap();
  return products.length;
}

export async function generateCollectionsSitemap(): Promise<MetadataRoute.Sitemap> {
  // Use cached collections for sitemap
  const collections = await getCachedCollectionsForSitemap();

  const config = getPageTypeConfig('collection');
  const entries: SitemapEntry[] = [];

  for (const collection of collections) {
    const lastModified = collection.updated_at ? new Date(collection.updated_at) : new Date();
    entries.push(...createBothLocaleEntries(
      `/shop/${collection.slug}`,
      lastModified,
      config.changeFrequency,
      config.priority
    ));
  }

  return entries;
}

export async function generateFacetsSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: SitemapEntry[] = [];

  // Get cached data
  const [facetCounts, allYears, allProducts] = await Promise.all([
    getCachedFacetCounts(),
    getCachedAvailableYears(),
    getCachedProductsForSitemap(),
  ]);

  // Type facets - only include if they have products
  const typeConfig = getPageTypeConfig('facet-type');
  for (const type of ['original', 'print'] as TypeFacetValue[]) {
    const count = facetCounts.types[type] || 0;
    if (count >= MIN_PRODUCTS_FOR_INDEX) {
      for (const locale of ['no', 'en'] as Locale[]) {
        const slug = TYPE_FACET_SLUGS[locale][type];
        entries.push(createLocalizedEntry(
          `/shop/type/${slug}`,
          locale,
          now,
          typeConfig.changeFrequency,
          typeConfig.priority
        ));
      }
    }
  }

  // Year facets - only include years with enough products
  const yearConfig = getPageTypeConfig('facet-year');
  for (const year of allYears) {
    const count = facetCounts.years[year] || 0;
    if (count >= MIN_PRODUCTS_FOR_INDEX) {
      entries.push(...createBothLocaleEntries(
        `/shop/year/${year}`,
        now,
        yearConfig.changeFrequency,
        yearConfig.priority
      ));
    }
  }

  // Price facets - only include ranges with enough products
  const priceConfig = getPageTypeConfig('facet-price');
  for (const range of PRICE_RANGES) {
    const count = facetCounts.priceRanges[range.slug] || 0;
    if (count >= MIN_PRODUCTS_FOR_INDEX) {
      entries.push(...createBothLocaleEntries(
        `/shop/price/${range.slug}`,
        now,
        priceConfig.changeFrequency,
        priceConfig.priority
      ));
    }
  }

  // Size facets - only include sizes with enough products
  const sizeConfig = getPageTypeConfig('facet-size');
  for (const size of ['small', 'medium', 'large', 'oversized'] as const) {
    const count = facetCounts.sizes[size] || 0;
    if (count >= MIN_PRODUCTS_FOR_INDEX) {
      for (const locale of ['no', 'en'] as Locale[]) {
        const slug = SIZE_FACET_SLUGS[locale][size];
        entries.push(createLocalizedEntry(
          `/shop/size/${slug}`,
          locale,
          now,
          sizeConfig.changeFrequency,
          sizeConfig.priority
        ));
      }
    }
  }

  // Type + Year combo facets - compute from product data
  const typeYearConfig = getPageTypeConfig('facet-type-year');
  const typeYearCounts = new Map<string, number>();
  for (const product of allProducts) {
    if (product.product_type && product.year) {
      const key = `${product.product_type}:${product.year}`;
      typeYearCounts.set(key, (typeYearCounts.get(key) || 0) + 1);
    }
  }

  for (const type of ['original', 'print'] as TypeFacetValue[]) {
    for (const year of allYears) {
      const count = typeYearCounts.get(`${type}:${year}`) || 0;
      if (count >= MIN_PRODUCTS_FOR_INDEX) {
        for (const locale of ['no', 'en'] as Locale[]) {
          const typeSlug = TYPE_FACET_SLUGS[locale][type];
          entries.push(createLocalizedEntry(
            `/shop/type/${typeSlug}/year/${year}`,
            locale,
            now,
            typeYearConfig.changeFrequency,
            typeYearConfig.priority
          ));
        }
      }
    }
  }

  return entries;
}

export async function generatePaginatedSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: SitemapEntry[] = [];
  const productCount = await getProductCount();
  const productsPerPage = 24;
  const totalPages = Math.ceil(productCount / productsPerPage);
  const paginatedConfig = getPageTypeConfig('shop-paginated');
  for (let page = 2; page <= totalPages; page++) {
    entries.push(...createBothLocaleEntries(
      `/shop?page=${page}`,
      now,
      paginatedConfig.changeFrequency,
      paginatedConfig.priority
    ));
  }

  return entries;
}

export type SitemapSegmentType = 'static' | 'products' | 'collections' | 'facets' | 'paginated';

export async function generateSitemapForSegment(
  segment: SitemapSegmentType,
  chunk?: number
): Promise<MetadataRoute.Sitemap> {
  switch (segment) {
    case 'static':
      return generateStaticSitemap();
    case 'products':
      return generateProductsSitemap(chunk);
    case 'collections':
      return generateCollectionsSitemap();
    case 'facets':
      return generateFacetsSitemap();
    case 'paginated':
      return generatePaginatedSitemap();
    default:
      return [];
  }
}
