import type { Locale, Product, ShippingSize } from '@/types';
import {
  TYPE_FACET_LABELS,
  SIZE_FACET_LABELS,
  PRICE_RANGE_LABELS,
  PRICE_RANGES,
  YEAR_FACET_LABELS,
} from '../facets';
import {
  getTypeFacetPath,
  getSizeFacetPath,
  getPriceFacetPath,
  getYearFacetPath,
} from '../facets/url-builder';

export interface RelatedFacetLink {
  label: string;
  href: string;
  description?: string;
  count?: number;
}

export interface RelatedFacetGroup {
  title: string;
  links: RelatedFacetLink[];
}

export function getRelatedFacetsForProduct(
  product: Product,
  locale: Locale,
  options: {
    maxLinks?: number;
    includeType?: boolean;
    includeSize?: boolean;
    includePrice?: boolean;
    includeYear?: boolean;
  } = {}
): RelatedFacetLink[] {
  const {
    maxLinks = 6,
    includeType = true,
    includeSize = true,
    includePrice = true,
    includeYear = true,
  } = options;

  const links: RelatedFacetLink[] = [];

  // Add type facet link
  if (includeType && product.product_type) {
    const typeLabel = TYPE_FACET_LABELS[locale][product.product_type];
    links.push({
      label: locale === 'no' ? `Flere ${typeLabel.toLowerCase()}` : `More ${typeLabel.toLowerCase()}`,
      href: `/${locale}${getTypeFacetPath(product.product_type, locale)}`,
      description: locale === 'no'
        ? `Se alle ${typeLabel.toLowerCase()}`
        : `View all ${typeLabel.toLowerCase()}`,
    });
  }

  // Add size facet link
  if (includeSize && product.shipping_size) {
    const sizeLabel = SIZE_FACET_LABELS[locale][product.shipping_size];
    links.push({
      label: sizeLabel,
      href: `/${locale}${getSizeFacetPath(product.shipping_size, locale)}`,
      description: locale === 'no'
        ? `Se alle ${sizeLabel.toLowerCase()} kunstverk`
        : `View all ${sizeLabel.toLowerCase()} artworks`,
    });
  }

  // Add price range facet link
  if (includePrice && product.price) {
    const priceRange = getPriceRangeForPrice(product.price);
    if (priceRange) {
      const rangeLabel = PRICE_RANGE_LABELS[locale][priceRange.slug];
      links.push({
        label: rangeLabel,
        href: `/${locale}${getPriceFacetPath(priceRange.slug)}`,
        description: locale === 'no'
          ? `Flere verk i denne prisklassen`
          : `More artworks in this price range`,
      });
    }
  }

  // Add year facet link
  if (includeYear && product.year) {
    const yearLabel = YEAR_FACET_LABELS[locale](product.year);
    links.push({
      label: String(product.year),
      href: `/${locale}${getYearFacetPath(product.year)}`,
      description: yearLabel,
    });
  }

  return links.slice(0, maxLinks);
}

function getPriceRangeForPrice(priceInOre: number): typeof PRICE_RANGES[number] | null {
  for (const range of PRICE_RANGES) {
    const aboveMin = range.minPrice === null || priceInOre >= range.minPrice;
    const belowMax = range.maxPrice === null || priceInOre < range.maxPrice;
    if (aboveMin && belowMax) {
      return range;
    }
  }
  return null;
}

export function getAllFacetGroups(
  locale: Locale,
  availableYears: number[] = [],
  facetCounts?: {
    types?: Record<string, number>;
    sizes?: Record<string, number>;
    years?: Record<number, number>;
    priceRanges?: Record<string, number>;
  }
): RelatedFacetGroup[] {
  const groups: RelatedFacetGroup[] = [];

  // Type facets
  groups.push({
    title: locale === 'no' ? 'Type' : 'Type',
    links: [
      {
        label: TYPE_FACET_LABELS[locale].original,
        href: `/${locale}${getTypeFacetPath('original', locale)}`,
        count: facetCounts?.types?.original,
      },
      {
        label: TYPE_FACET_LABELS[locale].print,
        href: `/${locale}${getTypeFacetPath('print', locale)}`,
        count: facetCounts?.types?.print,
      },
    ],
  });

  // Size facets
  const sizes: ShippingSize[] = ['small', 'medium', 'large', 'oversized'];
  groups.push({
    title: locale === 'no' ? 'Størrelse' : 'Size',
    links: sizes.map((size) => ({
      label: SIZE_FACET_LABELS[locale][size],
      href: `/${locale}${getSizeFacetPath(size, locale)}`,
      count: facetCounts?.sizes?.[size],
    })),
  });

  // Price range facets
  groups.push({
    title: locale === 'no' ? 'Prisklasse' : 'Price Range',
    links: PRICE_RANGES.map((range) => ({
      label: PRICE_RANGE_LABELS[locale][range.slug],
      href: `/${locale}${getPriceFacetPath(range.slug)}`,
      count: facetCounts?.priceRanges?.[range.slug],
    })),
  });

  // Year facets (only if years available)
  if (availableYears.length > 0) {
    groups.push({
      title: locale === 'no' ? 'År' : 'Year',
      links: availableYears.slice(0, 6).map((year) => ({
        label: String(year),
        href: `/${locale}${getYearFacetPath(year)}`,
        count: facetCounts?.years?.[year],
      })),
    });
  }

  return groups;
}

export function getCrossFacetLinks(
  currentFacetType: 'type' | 'year' | 'price' | 'size',
  locale: Locale
): RelatedFacetLink[] {
  const links: RelatedFacetLink[] = [];

  // Always include type links if not on type page
  if (currentFacetType !== 'type') {
    links.push({
      label: TYPE_FACET_LABELS[locale].original,
      href: `/${locale}${getTypeFacetPath('original', locale)}`,
    });
    links.push({
      label: TYPE_FACET_LABELS[locale].print,
      href: `/${locale}${getTypeFacetPath('print', locale)}`,
    });
  }

  // Include selected size links if not on size page
  if (currentFacetType !== 'size') {
    links.push({
      label: SIZE_FACET_LABELS[locale].small,
      href: `/${locale}${getSizeFacetPath('small', locale)}`,
    });
    links.push({
      label: SIZE_FACET_LABELS[locale].large,
      href: `/${locale}${getSizeFacetPath('large', locale)}`,
    });
  }

  // Include selected price links if not on price page
  if (currentFacetType !== 'price') {
    links.push({
      label: PRICE_RANGE_LABELS[locale]['under-2500'],
      href: `/${locale}${getPriceFacetPath('under-2500')}`,
    });
    links.push({
      label: PRICE_RANGE_LABELS[locale]['over-25000'],
      href: `/${locale}${getPriceFacetPath('over-25000')}`,
    });
  }

  return links.slice(0, 6);
}
