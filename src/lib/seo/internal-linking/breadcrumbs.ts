/**
 * Breadcrumb Generation for Internal Linking
 *
 * Generates breadcrumb trails for all page types to support
 * hub-and-spoke internal linking architecture.
 */

import type { Locale, Product, Collection } from '@/types';
import { TYPE_FACET_LABELS, SIZE_FACET_LABELS, PRICE_RANGE_LABELS } from '../facets';
import { getTypeFacetPath, getSizeFacetPath, getPriceFacetPath, getYearFacetPath } from '../facets/url-builder';

// ============================================================================
// Types
// ============================================================================

export interface BreadcrumbItem {
  name: string;
  href: string;
  position?: number;
}

export interface BreadcrumbOptions {
  locale: Locale;
  includeHome?: boolean;
}

// ============================================================================
// Base Breadcrumb Items
// ============================================================================

export function getHomeBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'no' ? 'Hjem' : 'Home',
    href: `/${locale}`,
  };
}

export function getShopBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: 'Shop',
    href: `/${locale}/shop`,
  };
}

// ============================================================================
// Product Breadcrumbs
// ============================================================================

export function getProductBreadcrumbs(
  product: Product,
  collection: Collection | null,
  options: BreadcrumbOptions
): BreadcrumbItem[] {
  const { locale, includeHome = true } = options;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    breadcrumbs.push(getHomeBreadcrumb(locale));
  }

  breadcrumbs.push(getShopBreadcrumb(locale));

  // Add collection if exists
  if (collection) {
    breadcrumbs.push({
      name: collection.name,
      href: `/${locale}/shop/${collection.slug}`,
    });
  }

  // Add product
  breadcrumbs.push({
    name: product.title,
    href: `/${locale}/shop/${product.slug}`,
  });

  return breadcrumbs.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

// ============================================================================
// Collection Breadcrumbs
// ============================================================================

export function getCollectionBreadcrumbs(
  collection: Collection,
  options: BreadcrumbOptions
): BreadcrumbItem[] {
  const { locale, includeHome = true } = options;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    breadcrumbs.push(getHomeBreadcrumb(locale));
  }

  breadcrumbs.push(getShopBreadcrumb(locale));

  breadcrumbs.push({
    name: collection.name,
    href: `/${locale}/shop/${collection.slug}`,
  });

  return breadcrumbs.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

// ============================================================================
// Faceted Page Breadcrumbs
// ============================================================================

export function getTypeFacetBreadcrumbs(
  type: 'original' | 'print',
  options: BreadcrumbOptions
): BreadcrumbItem[] {
  const { locale, includeHome = true } = options;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    breadcrumbs.push(getHomeBreadcrumb(locale));
  }

  breadcrumbs.push(getShopBreadcrumb(locale));

  breadcrumbs.push({
    name: TYPE_FACET_LABELS[locale][type],
    href: `/${locale}${getTypeFacetPath(type, locale)}`,
  });

  return breadcrumbs.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

export function getYearFacetBreadcrumbs(
  year: number,
  options: BreadcrumbOptions
): BreadcrumbItem[] {
  const { locale, includeHome = true } = options;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    breadcrumbs.push(getHomeBreadcrumb(locale));
  }

  breadcrumbs.push(getShopBreadcrumb(locale));

  breadcrumbs.push({
    name: String(year),
    href: `/${locale}${getYearFacetPath(year)}`,
  });

  return breadcrumbs.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

export function getPriceFacetBreadcrumbs(
  rangeSlug: string,
  options: BreadcrumbOptions
): BreadcrumbItem[] {
  const { locale, includeHome = true } = options;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    breadcrumbs.push(getHomeBreadcrumb(locale));
  }

  breadcrumbs.push(getShopBreadcrumb(locale));

  breadcrumbs.push({
    name: PRICE_RANGE_LABELS[locale][rangeSlug] || rangeSlug,
    href: `/${locale}${getPriceFacetPath(rangeSlug)}`,
  });

  return breadcrumbs.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

export function getSizeFacetBreadcrumbs(
  size: 'small' | 'medium' | 'large' | 'oversized',
  options: BreadcrumbOptions
): BreadcrumbItem[] {
  const { locale, includeHome = true } = options;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    breadcrumbs.push(getHomeBreadcrumb(locale));
  }

  breadcrumbs.push(getShopBreadcrumb(locale));

  breadcrumbs.push({
    name: SIZE_FACET_LABELS[locale][size],
    href: `/${locale}${getSizeFacetPath(size, locale)}`,
  });

  return breadcrumbs.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

export function getTypeYearFacetBreadcrumbs(
  type: 'original' | 'print',
  year: number,
  options: BreadcrumbOptions
): BreadcrumbItem[] {
  const { locale, includeHome = true } = options;
  const breadcrumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    breadcrumbs.push(getHomeBreadcrumb(locale));
  }

  breadcrumbs.push(getShopBreadcrumb(locale));

  breadcrumbs.push({
    name: TYPE_FACET_LABELS[locale][type],
    href: `/${locale}${getTypeFacetPath(type, locale)}`,
  });

  breadcrumbs.push({
    name: String(year),
    href: `/${locale}${getTypeFacetPath(type, locale)}/year/${year}`,
  });

  return breadcrumbs.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

// ============================================================================
// JSON-LD Format Conversion
// ============================================================================

export function breadcrumbsToJsonLdItems(
  breadcrumbs: BreadcrumbItem[]
): Array<{ name: string; url: string; position: number }> {
  return breadcrumbs.map((item, index) => ({
    name: item.name,
    url: item.href,
    position: index + 1,
  }));
}
