export * from './breadcrumbs';
export * from './related-facets';
export * from './link-budget';

import type { Locale, Product, Collection } from '@/types';
import {
  getProductBreadcrumbs,
  getCollectionBreadcrumbs,
  type BreadcrumbItem,
} from './breadcrumbs';
import {
  getRelatedFacetsForProduct,
  getAllFacetGroups,
  type RelatedFacetLink,
  type RelatedFacetGroup,
} from './related-facets';

export interface InternalLinkingData {
  breadcrumbs: BreadcrumbItem[];
  relatedFacets: RelatedFacetLink[];
  facetGroups?: RelatedFacetGroup[];
}

export function getProductInternalLinks(
  product: Product,
  collection: Collection | null,
  locale: Locale
): InternalLinkingData {
  return {
    breadcrumbs: getProductBreadcrumbs(product, collection, { locale }),
    relatedFacets: getRelatedFacetsForProduct(product, locale),
  };
}

export function getCollectionInternalLinks(
  collection: Collection,
  locale: Locale,
  availableYears: number[] = []
): InternalLinkingData {
  return {
    breadcrumbs: getCollectionBreadcrumbs(collection, { locale }),
    relatedFacets: [],
    facetGroups: getAllFacetGroups(locale, availableYears),
  };
}

export function getShopInternalLinks(
  locale: Locale,
  availableYears: number[] = [],
  facetCounts?: {
    types?: Record<string, number>;
    sizes?: Record<string, number>;
    years?: Record<number, number>;
    priceRanges?: Record<string, number>;
  }
): InternalLinkingData {
  return {
    breadcrumbs: [
      { name: locale === 'no' ? 'Hjem' : 'Home', href: `/${locale}`, position: 1 },
      { name: 'Shop', href: `/${locale}/shop`, position: 2 },
    ],
    relatedFacets: [],
    facetGroups: getAllFacetGroups(locale, availableYears, facetCounts),
  };
}
