export function isProductSold(product: { is_available: boolean; stock_quantity: number | null }): boolean {
  return !product.is_available || product.stock_quantity === 0;
}

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
