import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale, ShippingSize } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  SIZE_FACET_LABELS,
  SIZE_FACET_DESCRIPTIONS,
  getSizeValueFromSlug,
  getAllSizeFacetParams,
  TYPE_FACET_LABELS,
} from '@/lib/seo/facets';
import { getProductsBySize, getProductCountBySize } from '@/lib/seo/facets/queries';
import { getSizeFacetPath, getTypeFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ lang: string; size: string }>;
}

const ALL_SIZES: ShippingSize[] = ['small', 'medium', 'large', 'oversized'];

export function generateStaticParams(): Array<{ lang: string; size: string }> {
  const sizeParams = getAllSizeFacetParams();
  return locales.flatMap((lang) => sizeParams.map((param) => ({ lang, size: param.size })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, size: sizeSlug } = await params;
  const locale = lang as Locale;
  const sizeValue = getSizeValueFromSlug(sizeSlug, locale);

  if (!sizeValue) return {};

  return generateSeoMetadata({
    pageType: 'facet-size',
    locale,
    path: getSizeFacetPath(sizeValue, locale),
    sizeLabel: SIZE_FACET_LABELS[locale][sizeValue],
    sizeDescription: SIZE_FACET_DESCRIPTIONS[locale][sizeValue],
    productCount: await getProductCountBySize(sizeValue),
  });
}

export default async function SizeFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, size: sizeSlug } = await params;
  const locale = lang as Locale;
  const sizeValue = getSizeValueFromSlug(sizeSlug, locale);

  if (!sizeValue) notFound();

  const products = await getProductsBySize(sizeSlug, locale);
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
