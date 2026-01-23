import type { ProductListItem } from '@/types';

export function getProductAvailability(product: ProductListItem): string {
  const inStock = product.is_available && product.stock_quantity !== 0;
  return inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
}
