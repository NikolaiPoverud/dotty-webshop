import type { Locale } from '@/types';
import { MIN_PRODUCTS_FOR_INDEX } from './facets';

/**
 * Canonical URL Rules for SEO
 *
 * Manages canonical URLs, redirects, and noindex rules
 * to prevent duplicate content issues across programmatic pages.
 */

// ============================================================================
// Types
// ============================================================================

export type CanonicalAction = 'canonical' | 'redirect301' | 'redirect302' | 'noindex';

export interface CanonicalRule {
  pattern: RegExp;
  action: CanonicalAction;
  getCanonical: (url: URL, params?: Record<string, string>) => string | null;
  description: string;
}

// ============================================================================
// Canonical URL Rules
// ============================================================================

export const CANONICAL_RULES: CanonicalRule[] = [
  // Page 1 should redirect to clean URL
  {
    pattern: /[?&]page=1(&|$)/,
    action: 'redirect301',
    getCanonical: (url) => {
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete('page');
      return cleanUrl.pathname + (cleanUrl.search.length > 1 ? cleanUrl.search : '');
    },
    description: 'Redirect page=1 to clean URL',
  },

  // Sort parameters should use canonical
  {
    pattern: /[?&]sort=/,
    action: 'canonical',
    getCanonical: (url) => url.pathname,
    description: 'Canonicalize sorted pages to unsorted',
  },

  // Filter combinations that are too specific should canonicalize to parent
  {
    pattern: /\/type\/[^/]+\/price\/[^/]+$/,
    action: 'canonical',
    getCanonical: (url) => {
      // Canonicalize type+price to just type
      const match = url.pathname.match(/^(\/[^/]+\/shop\/type\/[^/]+)/);
      return match ? match[1] : url.pathname;
    },
    description: 'Canonicalize type+price to type',
  },

  // Trailing slashes - normalize to without
  {
    pattern: /\/$/,
    action: 'redirect301',
    getCanonical: (url) => {
      if (url.pathname === '/') return null;
      return url.pathname.slice(0, -1) + url.search;
    },
    description: 'Remove trailing slashes',
  },

  // Double slashes in path
  {
    pattern: /\/\//,
    action: 'redirect301',
    getCanonical: (url) => {
      return url.pathname.replace(/\/+/g, '/') + url.search;
    },
    description: 'Remove double slashes',
  },
];

// ============================================================================
// Noindex Rules
// ============================================================================

export interface NoindexCondition {
  check: (context: NoindexContext) => boolean;
  reason: string;
}

export interface NoindexContext {
  productCount: number;
  pageNumber?: number;
  facetType?: string;
  facetValue?: string;
  hasCanonical?: boolean;
  isComboFacet?: boolean;
}

export const NOINDEX_CONDITIONS: NoindexCondition[] = [
  {
    check: (ctx) => ctx.productCount < MIN_PRODUCTS_FOR_INDEX,
    reason: `Fewer than ${MIN_PRODUCTS_FOR_INDEX} products`,
  },
  {
    check: (ctx) => ctx.productCount === 0,
    reason: 'Empty facet',
  },
  {
    check: (ctx) => (ctx.pageNumber ?? 1) > 5,
    reason: 'Deep pagination (page > 5)',
  },
  {
    check: (ctx) => ctx.isComboFacet === true && ctx.productCount < 5,
    reason: 'Combo facet with few products',
  },
];

// ============================================================================
// Functions
// ============================================================================

/**
 * Check if a URL matches any canonical rule
 */
export function matchCanonicalRule(url: URL): { rule: CanonicalRule; canonical: string } | null {
  for (const rule of CANONICAL_RULES) {
    if (rule.pattern.test(url.pathname + url.search)) {
      const canonical = rule.getCanonical(url);
      if (canonical && canonical !== url.pathname + url.search) {
        return { rule, canonical };
      }
    }
  }
  return null;
}

/**
 * Determine if a page should be noindexed
 */
export function shouldNoindex(context: NoindexContext): { noindex: boolean; reason?: string } {
  for (const condition of NOINDEX_CONDITIONS) {
    if (condition.check(context)) {
      return { noindex: true, reason: condition.reason };
    }
  }
  return { noindex: false };
}

/**
 * Build the canonical URL for a facet page
 */
export function buildCanonicalForFacet(
  locale: Locale,
  facetType: string,
  facetValue: string,
  baseDomain: string
): string {
  const pathMap: Record<string, string> = {
    type: `/shop/type/${facetValue}`,
    year: `/shop/year/${facetValue}`,
    price: `/shop/price/${facetValue}`,
    size: `/shop/size/${facetValue}`,
    collection: `/collection/${facetValue}`,
  };

  const path = pathMap[facetType] ?? `/shop/${facetType}/${facetValue}`;
  return `${baseDomain}/${locale}${path}`;
}

/**
 * Get robots meta tag value based on context
 */
export function getRobotsMetaValue(context: NoindexContext): string {
  const { noindex, reason } = shouldNoindex(context);

  if (noindex) {
    // Log reason for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SEO] Noindex applied: ${reason}`);
    }
    return 'noindex, follow';
  }

  return 'index, follow';
}

/**
 * Determine if pagination should be followed
 */
export function shouldFollowPagination(pageNumber: number, totalPages: number): boolean {
  // Always follow first few pages
  if (pageNumber <= 3) return true;

  // Follow middle pages only if total is reasonable
  if (totalPages <= 10) return true;

  // For large sets, only follow up to page 5
  return pageNumber <= 5;
}

/**
 * Get pagination rel attributes
 */
export function getPaginationRels(
  currentPage: number,
  totalPages: number,
  baseUrl: string
): { prev?: string; next?: string } {
  const result: { prev?: string; next?: string } = {};

  if (currentPage > 1) {
    const prevPage = currentPage === 2 ? baseUrl : `${baseUrl}?page=${currentPage - 1}`;
    result.prev = prevPage;
  }

  if (currentPage < totalPages && shouldFollowPagination(currentPage + 1, totalPages)) {
    result.next = `${baseUrl}?page=${currentPage + 1}`;
  }

  return result;
}

// ============================================================================
// URL Normalization
// ============================================================================

/**
 * Normalize URL parameters for consistent caching
 */
export function normalizeUrlParams(searchParams: URLSearchParams): URLSearchParams {
  const normalized = new URLSearchParams();

  // Sort params alphabetically for consistent URLs
  const sortedKeys = Array.from(searchParams.keys()).sort();

  for (const key of sortedKeys) {
    const value = searchParams.get(key);
    if (value && value !== '') {
      // Skip page=1
      if (key === 'page' && value === '1') continue;

      // Normalize common values
      normalized.set(key, value.toLowerCase().trim());
    }
  }

  return normalized;
}

/**
 * Check if URL should be redirected
 */
export function getRedirectUrl(url: URL): { redirect: boolean; url: string; status: 301 | 302 } | null {
  const match = matchCanonicalRule(url);

  if (match && (match.rule.action === 'redirect301' || match.rule.action === 'redirect302')) {
    return {
      redirect: true,
      url: match.canonical,
      status: match.rule.action === 'redirect301' ? 301 : 302,
    };
  }

  return null;
}
