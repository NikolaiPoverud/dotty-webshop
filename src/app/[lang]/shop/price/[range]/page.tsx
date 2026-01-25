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
  getCachedProductsByPriceRange,
  getCachedFacetCounts,
} from '@/lib/supabase/cached-public';
import { getPriceFacetPath, getTypeFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ lang: string; range: string }>;
}

/**
 * Generate static params from known price ranges (no database calls)
 */
export function generateStaticParams(): Array<{ lang: string; range: string }> {
  const priceParams = getAllPriceFacetParams();
  return locales.flatMap((lang) => priceParams.map((param) => ({ lang, range: param.range })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, range: rangeSlug } = await params;
  const locale = lang as Locale;
  const range = getPriceRange(rangeSlug);

  if (!range) return {};

  // Use cached facet counts
  const facetCounts = await getCachedFacetCounts();
  const productCount = facetCounts.priceRanges[rangeSlug] ?? 0;

  return generateSeoMetadata({
    pageType: 'facet-price',
    locale,
    path: getPriceFacetPath(rangeSlug),
    rangeLabel: PRICE_RANGE_LABELS[locale][rangeSlug],
    rangeDescription: PRICE_RANGE_DESCRIPTIONS[locale][rangeSlug],
    productCount,
  });
}

export default async function PriceFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, range: rangeSlug } = await params;
  const locale = lang as Locale;
  const range = getPriceRange(rangeSlug);

  if (!range) notFound();

  // Use cached query
  const products = await getCachedProductsByPriceRange(range.minPrice, range.maxPrice);
  const rangeLabel = PRICE_RANGE_LABELS[locale][rangeSlug];
  const homeName = locale === 'no' ? 'Hjem' : 'Home';
  const title = locale === 'no' ? `Kunst ${rangeLabel}` : `Art ${rangeLabel}`;

  const breadcrumbs: FacetBreadcrumb[] = [
    { name: homeName, href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: rangeLabel, href: `/${locale}${getPriceFacetPath(rangeSlug)}` },
  ];

  const relatedFacets: RelatedFacet[] = [
    ...PRICE_RANGES.filter((r) => r.slug !== rangeSlug).slice(0, 3).map((r) => ({
      label: PRICE_RANGE_LABELS[locale][r.slug],
      href: `/${locale}${getPriceFacetPath(r.slug)}`,
    })),
    { label: TYPE_FACET_LABELS[locale].original, href: `/${locale}${getTypeFacetPath('original', locale)}` },
    { label: TYPE_FACET_LABELS[locale].print, href: `/${locale}${getTypeFacetPath('print', locale)}` },
  ];

  const emptyMessage = locale === 'no' ? 'Ingen kunstverk i denne prisklassen.' : 'No artworks in this price range.';

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={title}
        description={PRICE_RANGE_DESCRIPTIONS[locale][rangeSlug]}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
