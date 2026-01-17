/**
 * Type Facet Page
 *
 * Shows products filtered by type (original/print).
 * Routes:
 * - /no/shop/type/originaler
 * - /no/shop/type/trykk
 * - /en/shop/type/originals
 * - /en/shop/type/prints
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  TYPE_FACET_SLUGS,
  TYPE_FACET_LABELS,
  TYPE_FACET_DESCRIPTIONS,
  getTypeValueFromSlug,
  getAllTypeFacetParams,
  type TypeFacetValue,
} from '@/lib/seo/facets';
import {
  getProductsByType,
  getProductCountByType,
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
  const typeParams = getAllTypeFacetParams();
  return locales.flatMap((lang) =>
    typeParams.map((param) => ({ lang, type: param.type }))
  );
}

// ============================================================================
// Metadata
// ============================================================================

interface PageProps {
  params: Promise<{ lang: string; type: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, type: typeSlug } = await params;
  const locale = lang as Locale;

  const typeValue = getTypeValueFromSlug(typeSlug, locale);
  if (!typeValue) return {};

  const typeLabel = TYPE_FACET_LABELS[locale][typeValue];
  const typeDescription = TYPE_FACET_DESCRIPTIONS[locale][typeValue];
  const productCount = await getProductCountByType(typeValue);

  return generateSeoMetadata({
    pageType: 'facet-type',
    locale,
    path: getTypeFacetPath(typeValue, locale),
    typeLabel,
    typeDescription,
    productCount,
  });
}

// ============================================================================
// Page Component
// ============================================================================

export default async function TypeFacetPage({ params }: PageProps) {
  const { lang, type: typeSlug } = await params;
  const locale = lang as Locale;

  // Validate type slug
  const typeValue = getTypeValueFromSlug(typeSlug, locale);
  if (!typeValue) {
    notFound();
  }

  // Fetch products
  const products = await getProductsByType(typeSlug, locale);

  // Get labels and descriptions
  const typeLabel = TYPE_FACET_LABELS[locale][typeValue];
  const typeDescription = TYPE_FACET_DESCRIPTIONS[locale][typeValue];

  // Build breadcrumbs
  const breadcrumbs: FacetBreadcrumb[] = [
    { name: locale === 'no' ? 'Hjem' : 'Home', href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: typeLabel, href: `/${locale}${getTypeFacetPath(typeValue, locale)}` },
  ];

  // Build related facets (years available for this type)
  const availableYears = await getAvailableYearsForType(typeValue);
  const relatedFacets: RelatedFacet[] = availableYears.slice(0, 6).map((year) => ({
    label: String(year),
    href: `/${locale}${getTypeYearFacetPath(typeValue, year, locale)}`,
  }));

  // Empty message
  const emptyMessage = locale === 'no'
    ? 'Ingen kunstverk funnet i denne kategorien.'
    : 'No artworks found in this category.';

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={typeLabel}
        description={typeDescription}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
