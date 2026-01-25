import type { Locale } from '@/types';

/**
 * Link Budget System for Internal Linking
 *
 * Manages the distribution of internal links across page types
 * to optimize PageRank flow and prevent over-optimization.
 */

// ============================================================================
// Link Budget Configuration
// ============================================================================

export type PageAuthority = 'primary' | 'secondary' | 'tertiary';

export interface LinkBudget {
  maxOutbound: number;         // Maximum total outbound links
  hubLinks: number;            // Links to hub pages (parent categories)
  siblingLinks: number;        // Links to sibling facets (same level)
  childLinks: number;          // Links to child pages (more specific)
  crossFacetLinks: number;     // Links to different facet types
  productLinks: number;        // Links to product pages
  footerLinks: number;         // Links in footer section
}

export const LINK_BUDGETS: Record<PageAuthority, LinkBudget> = {
  // Primary hub pages (shop, main categories)
  primary: {
    maxOutbound: 100,
    hubLinks: 2,           // Home, Shop
    siblingLinks: 8,       // Other main categories
    childLinks: 20,        // Subcategories/facets
    crossFacetLinks: 10,   // Other facet types
    productLinks: 12,      // Featured products
    footerLinks: 10,       // Standard footer links
  },
  // Secondary pages (facet pages, collections)
  secondary: {
    maxOutbound: 50,
    hubLinks: 3,           // Home, Shop, Parent category
    siblingLinks: 6,       // Related facets at same level
    childLinks: 0,         // Usually no children
    crossFacetLinks: 4,    // Other facet types
    productLinks: 6,       // Products in this facet
    footerLinks: 8,        // Standard footer links
  },
  // Tertiary pages (combo facets, deep pages)
  tertiary: {
    maxOutbound: 30,
    hubLinks: 4,           // Full breadcrumb path
    siblingLinks: 4,       // Related combinations
    childLinks: 0,
    crossFacetLinks: 2,    // Limited cross-links
    productLinks: 4,       // Products in this facet
    footerLinks: 6,        // Standard footer links
  },
};

// ============================================================================
// Page Type to Authority Mapping
// ============================================================================

export type PageType = 'home' | 'shop' | 'type' | 'year' | 'price' | 'size' | 'collection' | 'type-year' | 'type-size' | 'type-price' | 'product';

export const PAGE_AUTHORITY: Record<PageType, PageAuthority> = {
  home: 'primary',
  shop: 'primary',
  type: 'secondary',
  year: 'secondary',
  price: 'secondary',
  size: 'secondary',
  collection: 'secondary',
  'type-year': 'tertiary',
  'type-size': 'tertiary',
  'type-price': 'tertiary',
  product: 'tertiary',
};

// ============================================================================
// Hub Pages Configuration
// ============================================================================

export interface HubPage {
  type: PageType;
  pathTemplate: (locale: Locale) => string;
  priority: number;  // 1 = highest priority
  label: Record<Locale, string>;
}

export const HUB_PAGES: HubPage[] = [
  {
    type: 'shop',
    pathTemplate: (locale) => `/${locale}/shop`,
    priority: 1,
    label: { no: 'Alle kunstverk', en: 'All artworks' },
  },
  {
    type: 'type',
    pathTemplate: (locale) => `/${locale}/shop/type/${locale === 'no' ? 'originaler' : 'originals'}`,
    priority: 2,
    label: { no: 'Originale kunstverk', en: 'Original artworks' },
  },
  {
    type: 'type',
    pathTemplate: (locale) => `/${locale}/shop/type/${locale === 'no' ? 'trykk' : 'prints'}`,
    priority: 2,
    label: { no: 'Kunsttrykk', en: 'Art prints' },
  },
];

// ============================================================================
// Link Selection Functions
// ============================================================================

export interface LinkCandidate {
  href: string;
  label: string;
  priority: number;
  type: 'hub' | 'sibling' | 'child' | 'cross-facet' | 'product';
}

/**
 * Get the link budget for a page type
 */
export function getLinkBudget(pageType: PageType): LinkBudget {
  const authority = PAGE_AUTHORITY[pageType];
  return LINK_BUDGETS[authority];
}

/**
 * Select links within budget, prioritizing higher priority items
 */
export function selectLinksWithinBudget(
  candidates: LinkCandidate[],
  budget: LinkBudget
): LinkCandidate[] {
  // Group candidates by type
  const byType: Record<string, LinkCandidate[]> = {
    hub: [],
    sibling: [],
    child: [],
    'cross-facet': [],
    product: [],
  };

  for (const candidate of candidates) {
    byType[candidate.type].push(candidate);
  }

  // Sort each group by priority (lower = higher priority)
  for (const type of Object.keys(byType)) {
    byType[type].sort((a, b) => a.priority - b.priority);
  }

  // Select up to budget for each type
  const selected: LinkCandidate[] = [
    ...byType.hub.slice(0, budget.hubLinks),
    ...byType.sibling.slice(0, budget.siblingLinks),
    ...byType.child.slice(0, budget.childLinks),
    ...byType['cross-facet'].slice(0, budget.crossFacetLinks),
    ...byType.product.slice(0, budget.productLinks),
  ];

  // Ensure we don't exceed max outbound
  return selected.slice(0, budget.maxOutbound);
}

/**
 * Get parent hub links for a page (breadcrumb path)
 */
export function getParentHubLinks(
  pageType: PageType,
  locale: Locale,
  currentPath?: string
): LinkCandidate[] {
  const links: LinkCandidate[] = [
    {
      href: `/${locale}`,
      label: locale === 'no' ? 'Hjem' : 'Home',
      priority: 1,
      type: 'hub',
    },
    {
      href: `/${locale}/shop`,
      label: 'Shop',
      priority: 2,
      type: 'hub',
    },
  ];

  // Add type hub if we're on a type-specific page
  if (pageType === 'type-year' || pageType === 'type-size' || pageType === 'type-price') {
    // Extract type from current path
    const typeMatch = currentPath?.match(/\/type\/([^/]+)/);
    if (typeMatch) {
      const typeSlug = typeMatch[1];
      const typeLabel = getTypeLabel(typeSlug, locale);
      links.push({
        href: `/${locale}/shop/type/${typeSlug}`,
        label: typeLabel,
        priority: 3,
        type: 'hub',
      });
    }
  }

  return links;
}

/**
 * Get sibling facet links (same level, different values)
 */
export function getSiblingFacetLinks(
  pageType: PageType,
  currentValue: string,
  allValues: string[],
  locale: Locale,
  maxLinks: number = 6
): LinkCandidate[] {
  const pathPrefix = getFacetPathPrefix(pageType, locale);

  return allValues
    .filter((v) => v !== currentValue)
    .slice(0, maxLinks)
    .map((value, index) => ({
      href: `/${locale}${pathPrefix}/${value}`,
      label: getFacetLabel(pageType, value, locale),
      priority: index + 1,
      type: 'sibling' as const,
    }));
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFacetPathPrefix(pageType: PageType, locale: Locale): string {
  const prefixes: Record<string, string> = {
    type: '/shop/type',
    year: '/shop/year',
    price: '/shop/price',
    size: '/shop/size',
    collection: '/collection',
  };
  return prefixes[pageType] ?? '/shop';
}

function getTypeLabel(typeSlug: string, locale: Locale): string {
  const labels: Record<Locale, Record<string, string>> = {
    no: { originaler: 'Originaler', trykk: 'Kunsttrykk' },
    en: { originals: 'Originals', prints: 'Prints' },
  };
  return labels[locale][typeSlug] ?? typeSlug;
}

function getFacetLabel(pageType: PageType, value: string, locale: Locale): string {
  // For now, return the value - could be expanded to use label mappings
  return value;
}
