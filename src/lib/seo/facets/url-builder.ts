import type { Locale, ShippingSize } from '@/types';
import {
  type TypeFacetValue,
  TYPE_FACET_SLUGS,
  SIZE_FACET_SLUGS,
  FACET_BASE_PATHS,
} from './index';

const DOMAIN_NO = process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no';
const DOMAIN_EN = process.env.NEXT_PUBLIC_DOMAIN_EN || 'https://dottyartwork.com';

export function getDomainForLocale(locale: Locale): string {
  return locale === 'no' ? DOMAIN_NO : DOMAIN_EN;
}

export function buildUrl(locale: Locale, ...pathSegments: string[]): string {
  const domain = getDomainForLocale(locale);
  const path = pathSegments.filter(Boolean).join('/');
  return `${domain}/${locale}/shop/${path}`;
}

export function buildPathOnly(...pathSegments: string[]): string {
  return `/shop/${pathSegments.filter(Boolean).join('/')}`;
}

export function getTypeFacetUrl(type: TypeFacetValue, locale: Locale): string {
  const slug = TYPE_FACET_SLUGS[locale][type];
  return buildUrl(locale, FACET_BASE_PATHS.type, slug);
}

export function getTypeFacetPath(type: TypeFacetValue, locale: Locale): string {
  const slug = TYPE_FACET_SLUGS[locale][type];
  return buildPathOnly(FACET_BASE_PATHS.type, slug);
}

export function getAllTypeFacetUrls(locale: Locale): Array<{ url: string; type: TypeFacetValue }> {
  return (['original', 'print'] as TypeFacetValue[]).map((type) => ({
    url: getTypeFacetUrl(type, locale),
    type,
  }));
}

export function getYearFacetUrl(year: number, locale: Locale): string {
  return buildUrl(locale, FACET_BASE_PATHS.year, String(year));
}

export function getYearFacetPath(year: number): string {
  return buildPathOnly(FACET_BASE_PATHS.year, String(year));
}

export function getYearFacetUrls(
  years: number[],
  locale: Locale
): Array<{ url: string; year: number }> {
  return years.map((year) => ({
    url: getYearFacetUrl(year, locale),
    year,
  }));
}

export function getPriceFacetUrl(rangeSlug: string, locale: Locale): string {
  return buildUrl(locale, FACET_BASE_PATHS.price, rangeSlug);
}

export function getPriceFacetPath(rangeSlug: string): string {
  return buildPathOnly(FACET_BASE_PATHS.price, rangeSlug);
}

export function getSizeFacetUrl(size: ShippingSize, locale: Locale): string {
  const slug = SIZE_FACET_SLUGS[locale][size];
  return buildUrl(locale, FACET_BASE_PATHS.size, slug);
}

export function getSizeFacetPath(size: ShippingSize, locale: Locale): string {
  const slug = SIZE_FACET_SLUGS[locale][size];
  return buildPathOnly(FACET_BASE_PATHS.size, slug);
}

export function getAllSizeFacetUrls(locale: Locale): Array<{ url: string; size: ShippingSize }> {
  return (['small', 'medium', 'large', 'oversized'] as ShippingSize[]).map((size) => ({
    url: getSizeFacetUrl(size, locale),
    size,
  }));
}

export function getTypeYearFacetUrl(
  type: TypeFacetValue,
  year: number,
  locale: Locale
): string {
  const typeSlug = TYPE_FACET_SLUGS[locale][type];
  return buildUrl(locale, FACET_BASE_PATHS.type, typeSlug, FACET_BASE_PATHS.year, String(year));
}

export function getTypeYearFacetPath(
  type: TypeFacetValue,
  year: number,
  locale: Locale
): string {
  const typeSlug = TYPE_FACET_SLUGS[locale][type];
  return buildPathOnly(FACET_BASE_PATHS.type, typeSlug, FACET_BASE_PATHS.year, String(year));
}

export interface AlternateUrls {
  'nb-NO': string;
  'en': string;
  'x-default': string;
}

export function getTypeFacetAlternates(type: TypeFacetValue): AlternateUrls {
  return {
    'nb-NO': getTypeFacetUrl(type, 'no'),
    'en': getTypeFacetUrl(type, 'en'),
    'x-default': getTypeFacetUrl(type, 'no'),
  };
}

export function getYearFacetAlternates(year: number): AlternateUrls {
  return {
    'nb-NO': getYearFacetUrl(year, 'no'),
    'en': getYearFacetUrl(year, 'en'),
    'x-default': getYearFacetUrl(year, 'no'),
  };
}

export function getPriceFacetAlternates(rangeSlug: string): AlternateUrls {
  return {
    'nb-NO': getPriceFacetUrl(rangeSlug, 'no'),
    'en': getPriceFacetUrl(rangeSlug, 'en'),
    'x-default': getPriceFacetUrl(rangeSlug, 'no'),
  };
}

export function getSizeFacetAlternates(size: ShippingSize): AlternateUrls {
  return {
    'nb-NO': getSizeFacetUrl(size, 'no'),
    'en': getSizeFacetUrl(size, 'en'),
    'x-default': getSizeFacetUrl(size, 'no'),
  };
}

export function getTypeYearFacetAlternates(
  type: TypeFacetValue,
  year: number
): AlternateUrls {
  return {
    'nb-NO': getTypeYearFacetUrl(type, year, 'no'),
    'en': getTypeYearFacetUrl(type, year, 'en'),
    'x-default': getTypeYearFacetUrl(type, year, 'no'),
  };
}

// ============================================================================
// Navigation Link Helpers
// ============================================================================

export interface FacetNavLink {
  href: string;
  label: string;
  count?: number;
}

export function buildFacetNavLinks(
  locale: Locale,
  labels: Record<string, string>,
  counts?: Record<string, number>
): {
  type: FacetNavLink[];
  year: FacetNavLink[];
  price: FacetNavLink[];
  size: FacetNavLink[];
} {
  const types: FacetNavLink[] = (['original', 'print'] as TypeFacetValue[]).map((type) => ({
    href: `/${locale}${getTypeFacetPath(type, locale)}`,
    label: labels[`type_${type}`] || type,
    count: counts?.[`type_${type}`],
  }));

  const sizes: FacetNavLink[] = (['small', 'medium', 'large', 'oversized'] as ShippingSize[]).map((size) => ({
    href: `/${locale}${getSizeFacetPath(size, locale)}`,
    label: labels[`size_${size}`] || size,
    count: counts?.[`size_${size}`],
  }));

  return {
    type: types,
    year: [], // Populated dynamically from database
    price: [], // Populated from price ranges
    size: sizes,
  };
}
