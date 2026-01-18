/**
 * Year Facet Page
 *
 * Shows products filtered by creation year.
 * Routes:
 * - /no/shop/year/2024
 * - /en/shop/year/2024
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  YEAR_FACET_LABELS,
  YEAR_FACET_DESCRIPTIONS,
  TYPE_FACET_LABELS,
} from '@/lib/seo/facets';
import {
  getProductsByYear,
  getProductCountByYear,
  getAvailableYears,
} from '@/lib/seo/facets/queries';
import {
  getYearFacetPath,
  getTypeFacetPath,
} from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

// ISR: Revalidate every hour
export const revalidate = 3600;

// ============================================================================
// Static Params
// ============================================================================

export async function generateStaticParams() {
  const years = await getAvailableYears();
  return locales.flatMap((lang) =>
    years.map((year) => ({ lang, year: String(year) }))
  );
}

// ============================================================================
// Metadata
// ============================================================================

interface PageProps {
  params: Promise<{ lang: string; year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);

  if (isNaN(year) || year < 1900 || year > 2100) return {};

  const productCount = await getProductCountByYear(year);

  return generateSeoMetadata({
    pageType: 'facet-year',
    locale,
    path: getYearFacetPath(year),
    year,
    productCount,
  });
}

// ============================================================================
// Page Component
// ============================================================================

export default async function YearFacetPage({ params }: PageProps) {
  const { lang, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);

  // Validate year
  if (isNaN(year) || year < 1900 || year > 2100) {
    notFound();
  }

  // Fetch products
  const products = await getProductsByYear(year);

  // If no products for this year, 404
  if (products.length === 0) {
    notFound();
  }

  // Get labels and descriptions
  const title = YEAR_FACET_LABELS[locale](year);
  const description = YEAR_FACET_DESCRIPTIONS[locale](year);

  // Build breadcrumbs
  const breadcrumbs: FacetBreadcrumb[] = [
    { name: locale === 'no' ? 'Hjem' : 'Home', href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: String(year), href: `/${locale}${getYearFacetPath(year)}` },
  ];

  // Build related facets (other years and product types)
  const availableYears = await getAvailableYears();
  const otherYears = availableYears.filter((y) => y !== year).slice(0, 4);
  const relatedFacets: RelatedFacet[] = [
    // Other years
    ...otherYears.map((y) => ({
      label: String(y),
      href: `/${locale}${getYearFacetPath(y)}`,
    })),
    // Product types
    {
      label: TYPE_FACET_LABELS[locale].original,
      href: `/${locale}${getTypeFacetPath('original', locale)}`,
    },
    {
      label: TYPE_FACET_LABELS[locale].print,
      href: `/${locale}${getTypeFacetPath('print', locale)}`,
    },
  ];

  // Empty message
  const emptyMessage = locale === 'no'
    ? `Ingen kunstverk fra ${year}.`
    : `No artworks from ${year}.`;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={title}
        description={description}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
