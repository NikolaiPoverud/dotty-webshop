/**
 * Determines if a product is sold/unavailable.
 * Returns true if is_available is false OR stock_quantity is 0.
 */
export function isProductSold(product: { is_available: boolean; stock_quantity: number | null }): boolean {
  return !product.is_available || product.stock_quantity === 0;
}

/**
 * Parses a JSONB field that might be a string or already parsed.
 * Handles the inconsistency between DB responses and cached data.
 */
export function parseJsonbField<T>(field: T | string | null | undefined, fallback: T): T {
  if (field == null) {
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
