import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/types';
import { locales } from '@/lib/i18n/get-dictionary';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo/metadata';
import {
  TYPE_FACET_LABELS,
  TYPE_FACET_DESCRIPTIONS,
  getTypeValueFromSlug,
  getAllTypeFacetParams,
} from '@/lib/seo/facets';
import {
  getProductsByType,
  getProductCountByType,
  getAvailableYearsForType,
} from '@/lib/seo/facets/queries';
import { getTypeFacetPath, getTypeYearFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ lang: string; type: string }>;
}

export function generateStaticParams(): Array<{ lang: string; type: string }> {
  const typeParams = getAllTypeFacetParams();
  return locales.flatMap((lang) => typeParams.map((param) => ({ lang, type: param.type })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, type: typeSlug } = await params;
  const locale = lang as Locale;
  const typeValue = getTypeValueFromSlug(typeSlug, locale);

  if (!typeValue) return {};

  return generateSeoMetadata({
    pageType: 'facet-type',
    locale,
    path: getTypeFacetPath(typeValue, locale),
    typeLabel: TYPE_FACET_LABELS[locale][typeValue],
    typeDescription: TYPE_FACET_DESCRIPTIONS[locale][typeValue],
    productCount: await getProductCountByType(typeValue),
  });
}

export default async function TypeFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, type: typeSlug } = await params;
  const locale = lang as Locale;
  const typeValue = getTypeValueFromSlug(typeSlug, locale);

  if (!typeValue) notFound();

  const [products, availableYears] = await Promise.all([
    getProductsByType(typeSlug, locale),
    getAvailableYearsForType(typeValue),
  ]);

  const typeLabel = TYPE_FACET_LABELS[locale][typeValue];
  const homeName = locale === 'no' ? 'Hjem' : 'Home';

  const breadcrumbs: FacetBreadcrumb[] = [
    { name: homeName, href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: typeLabel, href: `/${locale}${getTypeFacetPath(typeValue, locale)}` },
  ];

  const relatedFacets: RelatedFacet[] = availableYears.slice(0, 6).map((year) => ({
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
