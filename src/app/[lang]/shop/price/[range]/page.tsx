/**
 * Price Range Facet Page
 *
 * Shows products filtered by price range.
 * Routes:
 * - /no/shop/price/under-2500
 * - /no/shop/price/2500-5000
 * - /en/shop/price/5000-10000
 * etc.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  PRICE_RANGES,
  PRICE_RANGE_LABELS,
  PRICE_RANGE_DESCRIPTIONS,
  getPriceRange,
  getAllPriceFacetParams,
  TYPE_FACET_LABELS,
} from '@/lib/seo/facets';
import {
  getProductsByPriceRange,
  getProductCountByPriceRange,
} from '@/lib/seo/facets/queries';
import {
  getPriceFacetPath,
  getTypeFacetPath,
} from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

// ISR: Revalidate every hour
export const revalidate = 3600;

// ============================================================================
// Static Params
// ============================================================================

export async function generateStaticParams() {
  const priceParams = getAllPriceFacetParams();
  return locales.flatMap((lang) =>
    priceParams.map((param) => ({ lang, range: param.range }))
  );
}

// ============================================================================
// Metadata
// ============================================================================

interface PageProps {
  params: Promise<{ lang: string; range: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, range: rangeSlug } = await params;
  const locale = lang as Locale;

  const range = getPriceRange(rangeSlug);
  if (!range) return {};

  const rangeLabel = PRICE_RANGE_LABELS[locale][rangeSlug];
  const rangeDescription = PRICE_RANGE_DESCRIPTIONS[locale][rangeSlug];
  const productCount = await getProductCountByPriceRange(range);

  return generateSeoMetadata({
    pageType: 'facet-price',
    locale,
    path: getPriceFacetPath(rangeSlug),
    rangeLabel,
    rangeDescription,
    productCount,
  });
}

// ============================================================================
// Page Component
// ============================================================================

export default async function PriceFacetPage({ params }: PageProps) {
  const { lang, range: rangeSlug } = await params;
  const locale = lang as Locale;

  // Validate price range
  const range = getPriceRange(rangeSlug);
  if (!range) {
    notFound();
  }

  // Fetch products
  const products = await getProductsByPriceRange(rangeSlug);

  // Get labels and descriptions
  const rangeLabel = PRICE_RANGE_LABELS[locale][rangeSlug];
  const rangeDescription = PRICE_RANGE_DESCRIPTIONS[locale][rangeSlug];

  // Build title
  const title = locale === 'no'
    ? `Kunst ${rangeLabel}`
    : `Art ${rangeLabel}`;

  // Build breadcrumbs
  const breadcrumbs: FacetBreadcrumb[] = [
    { name: locale === 'no' ? 'Hjem' : 'Home', href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: rangeLabel, href: `/${locale}${getPriceFacetPath(rangeSlug)}` },
  ];

  // Build related facets (other price ranges and product types)
  const relatedFacets: RelatedFacet[] = [
    // Other price ranges
    ...PRICE_RANGES.filter((r) => r.slug !== rangeSlug).slice(0, 3).map((r) => ({
      label: PRICE_RANGE_LABELS[locale][r.slug],
      href: `/${locale}${getPriceFacetPath(r.slug)}`,
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
    ? `Ingen kunstverk i denne prisklassen.`
    : `No artworks in this price range.`;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={title}
        description={rangeDescription}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
