import type { Product, ProductListItem } from '@/types';

/**
 * Determines if a product is sold/unavailable
 * A product is considered sold if:
 * - is_available is false
 * - OR stock_quantity is 0 (for prints)
 */
export function isProductSold(product: Pick<Product | ProductListItem, 'is_available' | 'stock_quantity'>): boolean {
  return !product.is_available || product.stock_quantity === 0;
}

/**
 * Parses a JSONB field that might be a string or already parsed
 * Handles the inconsistency between DB responses and cached data
 */
export function parseJsonbField<T>(field: T | string | null | undefined, fallback: T): T {
  if (field === null || field === undefined) {
    return fallback;
  }
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return fallback;
    }
  }
  return field;
}
