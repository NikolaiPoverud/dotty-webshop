/**
 * Internal Linking Module
 *
 * Provides utilities for generating internal links to support
 * hub-and-spoke SEO architecture.
 */

export * from './breadcrumbs';
export * from './related-facets';

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

// ============================================================================
// Unified Internal Linking Interface
// ============================================================================

export interface InternalLinkingData {
  breadcrumbs: BreadcrumbItem[];
  relatedFacets: RelatedFacetLink[];
  facetGroups?: RelatedFacetGroup[];
}

/**
 * Get all internal linking data for a product page
 */
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

/**
 * Get all internal linking data for a collection page
 */
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

/**
 * Get internal linking data for the main shop page
 */
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
