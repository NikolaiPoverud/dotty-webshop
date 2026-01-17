/**
 * Combined Type + Year Facet Page
 *
 * Shows products filtered by both type and year.
 * Routes:
 * - /no/shop/type/originaler/year/2024
 * - /en/shop/type/prints/year/2023
 * etc.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  TYPE_FACET_SLUGS,
  TYPE_FACET_LABELS,
  getTypeValueFromSlug,
  type TypeFacetValue,
} from '@/lib/seo/facets';
import {
  getProductsByTypeAndYear,
  getProductCountByTypeAndYear,
  getAvailableYears,
  getAvailableYearsForType,
} from '@/lib/seo/facets/queries';
import {
  getTypeFacetPath,
  getYearFacetPath,
  getTypeYearFacetPath,
} from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

// ISR: Revalidate every hour
export const revalidate = 3600;

// ============================================================================
// Static Params
// ============================================================================

export async function generateStaticParams() {
  const params: Array<{ lang: string; type: string; year: string }> = [];

  for (const locale of locales) {
    for (const type of ['original', 'print'] as TypeFacetValue[]) {
      const years = await getAvailableYearsForType(type);
      const typeSlug = TYPE_FACET_SLUGS[locale][type];

      for (const year of years) {
        params.push({ lang: locale, type: typeSlug, year: String(year) });
      }
    }
  }

  return params;
}

// ============================================================================
// Metadata
// ============================================================================

interface PageProps {
  params: Promise<{ lang: string; type: string; year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, type: typeSlug, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);

  const typeValue = getTypeValueFromSlug(typeSlug, locale);
  if (!typeValue || isNaN(year) || year < 1900 || year > 2100) return {};

  const typeLabel = TYPE_FACET_LABELS[locale][typeValue];
  const productCount = await getProductCountByTypeAndYear(typeValue, year);

  return generateSeoMetadata({
    pageType: 'facet-type-year',
    locale,
    path: getTypeYearFacetPath(typeValue, year, locale),
    typeLabel,
    year,
    productCount,
  });
}

// ============================================================================
// Page Component
// ============================================================================

export default async function TypeYearFacetPage({ params }: PageProps) {
  const { lang, type: typeSlug, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);

  // Validate type and year
  const typeValue = getTypeValueFromSlug(typeSlug, locale);
  if (!typeValue || isNaN(year) || year < 1900 || year > 2100) {
    notFound();
  }

  // Fetch products
  const products = await getProductsByTypeAndYear(typeSlug, year, locale);

  // If no products, 404
  if (products.length === 0) {
    notFound();
  }

  // Get labels
  const typeLabel = TYPE_FACET_LABELS[locale][typeValue];

  // Build title and description
  const title = locale === 'no'
    ? `${typeLabel} fra ${year}`
    : `${typeLabel} from ${year}`;

  const description = locale === 'no'
    ? `Utforsk ${typeLabel.toLowerCase()} skapt i ${year}. ${products.length} unike pop-art verk fra dette året.`
    : `Explore ${typeLabel.toLowerCase()} created in ${year}. ${products.length} unique pop-art pieces from this year.`;

  // Build breadcrumbs
  const breadcrumbs: FacetBreadcrumb[] = [
    { name: locale === 'no' ? 'Hjem' : 'Home', href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: typeLabel, href: `/${locale}${getTypeFacetPath(typeValue, locale)}` },
    { name: String(year), href: `/${locale}${getTypeYearFacetPath(typeValue, year, locale)}` },
  ];

  // Build related facets
  const availableYears = await getAvailableYearsForType(typeValue);
  const otherYears = availableYears.filter((y) => y !== year).slice(0, 4);

  // Get the other type
  const otherType: TypeFacetValue = typeValue === 'original' ? 'print' : 'original';
  const otherTypeLabel = TYPE_FACET_LABELS[locale][otherType];

  const relatedFacets: RelatedFacet[] = [
    // Other years for same type
    ...otherYears.map((y) => ({
      label: String(y),
      href: `/${locale}${getTypeYearFacetPath(typeValue, y, locale)}`,
    })),
    // Other type (same year if available)
    {
      label: otherTypeLabel,
      href: `/${locale}${getTypeFacetPath(otherType, locale)}`,
    },
    // All years page
    {
      label: locale === 'no' ? `Alle ${year}` : `All ${year}`,
      href: `/${locale}${getYearFacetPath(year)}`,
    },
  ];

  // Empty message
  const emptyMessage = locale === 'no'
    ? `Ingen ${typeLabel.toLowerCase()} fra ${year}.`
    : `No ${typeLabel.toLowerCase()} from ${year}.`;

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
