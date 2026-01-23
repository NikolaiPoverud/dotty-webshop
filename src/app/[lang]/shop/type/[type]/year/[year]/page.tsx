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
  getAvailableYearsForType,
} from '@/lib/seo/facets/queries';
import { getTypeFacetPath, getYearFacetPath, getTypeYearFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ lang: string; type: string; year: string }>;
}

function isValidYear(year: number): boolean {
  return !isNaN(year) && year >= 1900 && year <= 2100;
}

export async function generateStaticParams(): Promise<Array<{ lang: string; type: string; year: string }>> {
  const params: Array<{ lang: string; type: string; year: string }> = [];

  for (const locale of locales) {
    for (const type of ['original', 'print'] as TypeFacetValue[]) {
      const years = await getAvailableYearsForType(type);
      const typeSlug = TYPE_FACET_SLUGS[locale][type];
      params.push(...years.map((year) => ({ lang: locale, type: typeSlug, year: String(year) })));
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, type: typeSlug, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);
  const typeValue = getTypeValueFromSlug(typeSlug, locale);

  if (!typeValue || !isValidYear(year)) return {};

  return generateSeoMetadata({
    pageType: 'facet-type-year',
    locale,
    path: getTypeYearFacetPath(typeValue, year, locale),
    typeLabel: TYPE_FACET_LABELS[locale][typeValue],
    year,
    productCount: await getProductCountByTypeAndYear(typeValue, year),
  });
}

export default async function TypeYearFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, type: typeSlug, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);
  const typeValue = getTypeValueFromSlug(typeSlug, locale);

  if (!typeValue || !isValidYear(year)) notFound();

  const [products, availableYears] = await Promise.all([
    getProductsByTypeAndYear(typeSlug, year, locale),
    getAvailableYearsForType(typeValue),
  ]);

  if (products.length === 0) notFound();

  const typeLabel = TYPE_FACET_LABELS[locale][typeValue];
  const homeName = locale === 'no' ? 'Hjem' : 'Home';
  const title = locale === 'no' ? `${typeLabel} fra ${year}` : `${typeLabel} from ${year}`;
  const description = locale === 'no'
    ? `Utforsk ${typeLabel.toLowerCase()} skapt i ${year}. ${products.length} unike pop-art verk fra dette året.`
    : `Explore ${typeLabel.toLowerCase()} created in ${year}. ${products.length} unique pop-art pieces from this year.`;

  const breadcrumbs: FacetBreadcrumb[] = [
    { name: homeName, href: `/${locale}` },
    { name: 'Shop', href: `/${locale}/shop` },
    { name: typeLabel, href: `/${locale}${getTypeFacetPath(typeValue, locale)}` },
    { name: String(year), href: `/${locale}${getTypeYearFacetPath(typeValue, year, locale)}` },
  ];

  const otherType: TypeFacetValue = typeValue === 'original' ? 'print' : 'original';
  const otherYears = availableYears.filter((y) => y !== year).slice(0, 4);

  const relatedFacets: RelatedFacet[] = [
    ...otherYears.map((y) => ({ label: String(y), href: `/${locale}${getTypeYearFacetPath(typeValue, y, locale)}` })),
    { label: TYPE_FACET_LABELS[locale][otherType], href: `/${locale}${getTypeFacetPath(otherType, locale)}` },
    { label: locale === 'no' ? `Alle ${year}` : `All ${year}`, href: `/${locale}${getYearFacetPath(year)}` },
  ];

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
