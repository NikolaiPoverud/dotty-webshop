import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import { YEAR_FACET_LABELS, YEAR_FACET_DESCRIPTIONS, TYPE_FACET_LABELS } from '@/lib/seo/facets';
import {
  getCachedProductsByYear,
  getCachedFacetCounts,
  getCachedAvailableYears,
} from '@/lib/supabase/cached-public';
import { getYearFacetPath, getTypeFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;
export const dynamicParams = true; // Allow runtime generation for any valid year

interface PageProps {
  params: Promise<{ lang: string; year: string }>;
}

function isValidYear(year: number): boolean {
  return !isNaN(year) && year >= 1900 && year <= 2100;
}

/**
 * Generate static params from cached available years
 * Only generates locale variants, actual years are generated on-demand
 */
export function generateStaticParams(): Array<{ lang: string; year: string }> {
  // Return empty array - years will be generated on-demand
  // This avoids database calls at build time
  return locales.map((lang) => ({ lang, year: '2024' })); // Pre-generate current year only
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);

  if (!isValidYear(year)) return {};

  // Use cached facet counts
  const facetCounts = await getCachedFacetCounts();
  const productCount = facetCounts.years[year] ?? 0;

  return generateSeoMetadata({
    pageType: 'facet-year',
    locale,
    path: getYearFacetPath(year),
    year,
    productCount,
  });
}

export default async function YearFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);

  if (!isValidYear(year)) notFound();

  // Use cached queries
  const [products, availableYears] = await Promise.all([
    getCachedProductsByYear(year),
    getCachedAvailableYears(),
  ]);

  if (products.length === 0) notFound();

  const homeName = locale === 'no' ? 'Hjem' : 'Home';
  const otherYears = availableYears.filter((y) => y !== year).slice(0, 4);

  const breadcrumbs: FacetBreadcrumb[] = [
    { name: homeName, href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: String(year), href: `/${locale}${getYearFacetPath(year)}` },
  ];

  const relatedFacets: RelatedFacet[] = [
    ...otherYears.map((y) => ({ label: String(y), href: `/${locale}${getYearFacetPath(y)}` })),
    { label: TYPE_FACET_LABELS[locale].original, href: `/${locale}${getTypeFacetPath('original', locale)}` },
    { label: TYPE_FACET_LABELS[locale].print, href: `/${locale}${getTypeFacetPath('print', locale)}` },
  ];

  const emptyMessage = locale === 'no' ? `Ingen kunstverk fra ${year}.` : `No artworks from ${year}.`;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={YEAR_FACET_LABELS[locale](year)}
        description={YEAR_FACET_DESCRIPTIONS[locale](year)}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
