import 'server-only';

import type { MetadataRoute } from 'next';
import type { Locale } from '@/types';
import { createPublicClient } from '@/lib/supabase/public';
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
import {
  getAvailableYears,
  getAvailableYearsForType,
} from '../facets/queries';

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
  const supabase = createPublicClient();
  const offset = (chunk - 1) * MAX_URLS_PER_SEGMENT;

  const { data: products, error } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .range(offset, offset + MAX_URLS_PER_SEGMENT - 1);

  if (error) {
    console.error('Failed to fetch products for sitemap:', error);
    return [];
  }

  const config = getPageTypeConfig('product');
  const entries: SitemapEntry[] = [];

  for (const product of products || []) {
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
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to count products:', error);
    return 0;
  }

  return count ?? 0;
}

export async function generateCollectionsSitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const { data: collections, error } = await supabase
    .from('collections')
    .select('slug, updated_at')
    .eq('is_public', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to fetch collections for sitemap:', error);
    return [];
  }

  const config = getPageTypeConfig('collection');
  const entries: SitemapEntry[] = [];

  for (const collection of collections || []) {
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

  const typeConfig = getPageTypeConfig('facet-type');
  for (const type of ['original', 'print'] as TypeFacetValue[]) {
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

  const years = await getAvailableYears();
  const yearConfig = getPageTypeConfig('facet-year');
  for (const year of years) {
    entries.push(...createBothLocaleEntries(
      `/shop/year/${year}`,
      now,
      yearConfig.changeFrequency,
      yearConfig.priority
    ));
  }

  const priceConfig = getPageTypeConfig('facet-price');
  for (const range of PRICE_RANGES) {
    entries.push(...createBothLocaleEntries(
      `/shop/price/${range.slug}`,
      now,
      priceConfig.changeFrequency,
      priceConfig.priority
    ));
  }

  const sizeConfig = getPageTypeConfig('facet-size');
  for (const size of ['small', 'medium', 'large', 'oversized'] as const) {
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

  const typeYearConfig = getPageTypeConfig('facet-type-year');
  for (const type of ['original', 'print'] as TypeFacetValue[]) {
    const typeYears = await getAvailableYearsForType(type);
    for (const year of typeYears) {
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
