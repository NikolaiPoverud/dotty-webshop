import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  TYPE_FACET_LABELS,
  TYPE_FACET_DESCRIPTIONS,
  TYPE_FACET_SLUGS,
  getTypeValueFromSlug,
} from '@/lib/seo/facets';
import {
  getCachedProductsByType,
  getCachedFacetCounts,
  getCachedAvailableYears,
} from '@/lib/supabase/cached-public';
import { getTypeFacetPath, getTypeYearFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;
export const dynamicParams = true; // Allow runtime generation for any valid slug

interface PageProps {
  params: Promise<{ lang: string; type: string }>;
}

/**
 * Generate static params only for locale variants
 * This avoids database calls at build time while still pre-rendering known type slugs
 */
export function generateStaticParams(): Array<{ lang: string; type: string }> {
  // Generate params from static config, no database calls
  const params: Array<{ lang: string; type: string }> = [];

  for (const lang of locales) {
    for (const slug of Object.values(TYPE_FACET_SLUGS[lang])) {
      params.push({ lang, type: slug });
    }
  }

  // Deduplicate by type slug
  return [...new Map(params.map((p) => [`${p.lang}-${p.type}`, p])).values()];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, type: typeSlug } = await params;
  const locale = lang as Locale;
  const typeValue = getTypeValueFromSlug(typeSlug, locale);

  if (!typeValue) return {};

  // Use cached facet counts
  const facetCounts = await getCachedFacetCounts();
  const productCount = facetCounts.types[typeValue] ?? 0;

  return generateSeoMetadata({
    pageType: 'facet-type',
    locale,
    path: getTypeFacetPath(typeValue, locale),
    typeLabel: TYPE_FACET_LABELS[locale][typeValue],
    typeDescription: TYPE_FACET_DESCRIPTIONS[locale][typeValue],
    productCount,
  });
}

export default async function TypeFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, type: typeSlug } = await params;
  const locale = lang as Locale;
  const typeValue = getTypeValueFromSlug(typeSlug, locale);

  if (!typeValue) notFound();

  // Use cached queries for better performance
  const [products, availableYears] = await Promise.all([
    getCachedProductsByType(typeValue),
    getCachedAvailableYears(),
  ]);

  // Filter years to those that have products of this type
  // We'll use the years that appear in the products we fetched
  const productYears = [...new Set(products.map(p => p.year).filter(Boolean))] as number[];
  const filteredYears = productYears.sort((a, b) => b - a);

  const typeLabel = TYPE_FACET_LABELS[locale][typeValue];
  const homeName = locale === 'no' ? 'Hjem' : 'Home';

  const breadcrumbs: FacetBreadcrumb[] = [
    { name: homeName, href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: typeLabel, href: `/${locale}${getTypeFacetPath(typeValue, locale)}` },
  ];

  const relatedFacets: RelatedFacet[] = filteredYears.slice(0, 6).map((year) => ({
    label: String(year),
    href: `/${locale}${getTypeYearFacetPath(typeValue, year, locale)}`,
  }));

  const emptyMessage = locale === 'no' ? 'Ingen kunstverk funnet i denne kategorien.' : 'No artworks found in this category.';

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={typeLabel}
        description={TYPE_FACET_DESCRIPTIONS[locale][typeValue]}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
