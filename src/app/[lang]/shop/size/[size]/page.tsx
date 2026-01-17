/**
 * Size Facet Page
 *
 * Shows products filtered by shipping size category.
 * Routes:
 * - /no/shop/size/liten
 * - /no/shop/size/medium
 * - /en/shop/size/small
 * - /en/shop/size/large
 * etc.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale, ShippingSize } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  SIZE_FACET_SLUGS,
  SIZE_FACET_LABELS,
  SIZE_FACET_DESCRIPTIONS,
  getSizeValueFromSlug,
  getAllSizeFacetParams,
  TYPE_FACET_LABELS,
} from '@/lib/seo/facets';
import {
  getProductsBySize,
  getProductCountBySize,
} from '@/lib/seo/facets/queries';
import {
  getSizeFacetPath,
  getTypeFacetPath,
} from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

// ISR: Revalidate every hour
export const revalidate = 3600;

// ============================================================================
// Static Params
// ============================================================================

export async function generateStaticParams() {
  const sizeParams = getAllSizeFacetParams();
  return locales.flatMap((lang) =>
    sizeParams.map((param) => ({ lang, size: param.size }))
  );
}

// ============================================================================
// Metadata
// ============================================================================

interface PageProps {
  params: Promise<{ lang: string; size: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, size: sizeSlug } = await params;
  const locale = lang as Locale;

  const sizeValue = getSizeValueFromSlug(sizeSlug, locale);
  if (!sizeValue) return {};

  const sizeLabel = SIZE_FACET_LABELS[locale][sizeValue];
  const sizeDescription = SIZE_FACET_DESCRIPTIONS[locale][sizeValue];
  const productCount = await getProductCountBySize(sizeValue);

  return generateSeoMetadata({
    pageType: 'facet-size',
    locale,
    path: getSizeFacetPath(sizeValue, locale),
    sizeLabel,
    sizeDescription,
    productCount,
  });
}

// ============================================================================
// Page Component
// ============================================================================

export default async function SizeFacetPage({ params }: PageProps) {
  const { lang, size: sizeSlug } = await params;
  const locale = lang as Locale;

  // Validate size slug
  const sizeValue = getSizeValueFromSlug(sizeSlug, locale);
  if (!sizeValue) {
    notFound();
  }

  // Fetch products
  const products = await getProductsBySize(sizeSlug, locale);

  // Get labels and descriptions
  const sizeLabel = SIZE_FACET_LABELS[locale][sizeValue];
  const sizeDescription = SIZE_FACET_DESCRIPTIONS[locale][sizeValue];

  // Build title
  const title = locale === 'no'
    ? `${sizeLabel} Kunstverk`
    : `${sizeLabel} Artworks`;

  // Build breadcrumbs
  const breadcrumbs: FacetBreadcrumb[] = [
    { name: locale === 'no' ? 'Hjem' : 'Home', href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: sizeLabel, href: `/${locale}${getSizeFacetPath(sizeValue, locale)}` },
  ];

  // Build related facets (other sizes and product types)
  const allSizes: ShippingSize[] = ['small', 'medium', 'large', 'oversized'];
  const relatedFacets: RelatedFacet[] = [
    // Other sizes
    ...allSizes.filter((s) => s !== sizeValue).map((s) => ({
      label: SIZE_FACET_LABELS[locale][s],
      href: `/${locale}${getSizeFacetPath(s, locale)}`,
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
    ? `Ingen kunstverk i denne størrelsen.`
    : `No artworks in this size.`;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={title}
        description={sizeDescription}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
