import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale, ShippingSize } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  SIZE_FACET_LABELS,
  SIZE_FACET_DESCRIPTIONS,
  SIZE_FACET_SLUGS,
  getSizeValueFromSlug,
  TYPE_FACET_LABELS,
} from '@/lib/seo/facets';
import {
  getCachedProductsBySize,
  getCachedFacetCounts,
} from '@/lib/supabase/cached-public';
import { getSizeFacetPath, getTypeFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ lang: string; size: string }>;
}

const ALL_SIZES: ShippingSize[] = ['small', 'medium', 'large', 'oversized'];

/**
 * Generate static params from known size slugs (no database calls)
 */
export function generateStaticParams(): Array<{ lang: string; size: string }> {
  const params: Array<{ lang: string; size: string }> = [];

  for (const lang of locales) {
    for (const slug of Object.values(SIZE_FACET_SLUGS[lang])) {
      params.push({ lang, size: slug });
    }
  }

  // Deduplicate by size slug
  return [...new Map(params.map((p) => [`${p.lang}-${p.size}`, p])).values()];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, size: sizeSlug } = await params;
  const locale = lang as Locale;
  const sizeValue = getSizeValueFromSlug(sizeSlug, locale);

  if (!sizeValue) return {};

  // Use cached facet counts
  const facetCounts = await getCachedFacetCounts();
  const productCount = facetCounts.sizes[sizeValue] ?? 0;

  return generateSeoMetadata({
    pageType: 'facet-size',
    locale,
    path: getSizeFacetPath(sizeValue, locale),
    sizeLabel: SIZE_FACET_LABELS[locale][sizeValue],
    sizeDescription: SIZE_FACET_DESCRIPTIONS[locale][sizeValue],
    productCount,
  });
}

export default async function SizeFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, size: sizeSlug } = await params;
  const locale = lang as Locale;
  const sizeValue = getSizeValueFromSlug(sizeSlug, locale);

  if (!sizeValue) notFound();

  // Use cached query
  const products = await getCachedProductsBySize(sizeValue);
  const sizeLabel = SIZE_FACET_LABELS[locale][sizeValue];
  const homeName = locale === 'no' ? 'Hjem' : 'Home';
  const title = locale === 'no' ? `${sizeLabel} Kunstverk` : `${sizeLabel} Artworks`;

  const breadcrumbs: FacetBreadcrumb[] = [
    { name: homeName, href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: sizeLabel, href: `/${locale}${getSizeFacetPath(sizeValue, locale)}` },
  ];

  const relatedFacets: RelatedFacet[] = [
    ...ALL_SIZES.filter((s) => s !== sizeValue).map((s) => ({
      label: SIZE_FACET_LABELS[locale][s],
      href: `/${locale}${getSizeFacetPath(s, locale)}`,
    })),
    { label: TYPE_FACET_LABELS[locale].original, href: `/${locale}${getTypeFacetPath('original', locale)}` },
    { label: TYPE_FACET_LABELS[locale].print, href: `/${locale}${getTypeFacetPath('print', locale)}` },
  ];

  const emptyMessage = locale === 'no' ? 'Ingen kunstverk i denne størrelsen.' : 'No artworks in this size.';

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <FacetedShopContent
        products={products}
        title={title}
        description={SIZE_FACET_DESCRIPTIONS[locale][sizeValue]}
        locale={locale}
        breadcrumbs={breadcrumbs}
        relatedFacets={relatedFacets}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}
