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
  getCachedProductsByTypeAndYear,
  getCachedAvailableYears,
} from '@/lib/supabase/cached-public';
import { getTypeFacetPath, getYearFacetPath, getTypeYearFacetPath } from '@/lib/seo/facets/url-builder';
import { FacetedShopContent, type FacetBreadcrumb, type RelatedFacet } from '@/components/shop/faceted-shop-content';

export const revalidate = 3600;
export const dynamicParams = true; // Allow runtime generation for any valid combo

interface PageProps {
  params: Promise<{ lang: string; type: string; year: string }>;
}

function isValidYear(year: number): boolean {
  return !isNaN(year) && year >= 1900 && year <= 2100;
}

/**
 * Generate static params without database calls
 * Only pre-generate the most common combinations
 */
export function generateStaticParams(): Array<{ lang: string; type: string; year: string }> {
  const currentYear = new Date().getFullYear();
  const recentYears = [currentYear, currentYear - 1, currentYear - 2];

  const params: Array<{ lang: string; type: string; year: string }> = [];

  for (const locale of locales) {
    for (const type of ['original', 'print'] as TypeFacetValue[]) {
      const typeSlug = TYPE_FACET_SLUGS[locale][type];
      // Only pre-generate recent years to minimize build time
      params.push(...recentYears.map((year) => ({
        lang: locale,
        type: typeSlug,
        year: String(year),
      })));
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

  // Use cached query to get product count
  const products = await getCachedProductsByTypeAndYear(typeValue, year);

  return generateSeoMetadata({
    pageType: 'facet-type-year',
    locale,
    path: getTypeYearFacetPath(typeValue, year, locale),
    typeLabel: TYPE_FACET_LABELS[locale][typeValue],
    year,
    productCount: products.length,
  });
}

export default async function TypeYearFacetPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { lang, type: typeSlug, year: yearStr } = await params;
  const locale = lang as Locale;
  const year = parseInt(yearStr, 10);
  const typeValue = getTypeValueFromSlug(typeSlug, locale);

  if (!typeValue || !isValidYear(year)) notFound();

  // Use cached queries
  const [products, availableYears] = await Promise.all([
    getCachedProductsByTypeAndYear(typeValue, year),
    getCachedAvailableYears(),
  ]);

  if (products.length === 0) notFound();

  // Filter years to those that appear in products of this type
  const productYearsForType = await getCachedProductsByTypeAndYear(typeValue, year)
    .then(() => availableYears); // For now just use available years

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
  const otherYears = productYearsForType.filter((y) => y !== year).slice(0, 4);

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
