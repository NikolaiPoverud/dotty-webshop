import { calculateArtistLevy as calculateLevyFromUtils } from '@/lib/utils';

export interface CartItemInput {
  productId: string;
  title: string;
  price: number; // Price in øre (NOK cents)
  quantity: number;
  shippingCost?: number | null; // Shipping cost in øre
}

export interface CartCalculation {
  subtotal: number;
  shippingCost: number;
  artistLevy: number;
  discountAmount: number;
  total: number;
}

export interface CartCalculationWithBreakdown extends CartCalculation {
  itemCount: number;
  levyItems: Array<{
    productId: string;
    title: string;
    price: number;
    levy: number;
  }>;
}

export interface DiscountInfo {
  code: string;
  amount: number;
}

export const ARTIST_LEVY_RATE = 0.05;
export const ARTIST_LEVY_THRESHOLD = 250000;

export function calculateSubtotal(items: CartItemInput[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateShippingCost(items: CartItemInput[]): number {
  return items.reduce((max, item) => Math.max(max, item.shippingCost ?? 0), 0);
}

export function calculateArtistLevy(items: CartItemInput[]): {
  totalLevy: number;
  levyItems: Array<{ productId: string; title: string; price: number; levy: number }>;
} {
  const levyInput = items.map(item => ({
    id: item.productId,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
  }));

  const result = calculateLevyFromUtils(levyInput);

  return {
    totalLevy: result.totalLevy,
    levyItems: result.items.map(item => ({
      productId: item.productId,
      title: item.productTitle,
      price: item.price,
      levy: item.levyAmount,
    })),
  };
}

export function calculateCartTotals(
  items: CartItemInput[],
  discount?: DiscountInfo | null,
  customShippingCost?: number | null
): CartCalculationWithBreakdown {
  const subtotal = calculateSubtotal(items);
  const shippingCost = customShippingCost ?? calculateShippingCost(items);
  const { totalLevy: artistLevy, levyItems } = calculateArtistLevy(items);
  const discountAmount = discount?.amount ?? 0;

  // Discount applies only to subtotal, not shipping or artist levy
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const total = discountedSubtotal + shippingCost + artistLevy;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    shippingCost,
    artistLevy,
    discountAmount,
    total,
    itemCount,
    levyItems,
  };
}

export function calculateCartTotalsSimple(
  items: CartItemInput[],
  discountAmount: number = 0,
  customShippingCost?: number | null
): CartCalculation {
  const subtotal = calculateSubtotal(items);
  const shippingCost = customShippingCost ?? calculateShippingCost(items);
  const { totalLevy: artistLevy } = calculateArtistLevy(items);

  // Discount applies only to subtotal
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const total = discountedSubtotal + shippingCost + artistLevy;

  return {
    subtotal,
    shippingCost,
    artistLevy,
    discountAmount,
    total,
  };
}

export function validateCartTotals(
  submitted: CartCalculation,
  calculated: CartCalculation,
  tolerance: number = 100
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (Math.abs(submitted.subtotal - calculated.subtotal) > tolerance) {
    errors.push(`Subtotal mismatch: submitted ${submitted.subtotal}, calculated ${calculated.subtotal}`);
  }

  if (Math.abs(submitted.shippingCost - calculated.shippingCost) > tolerance) {
    errors.push(`Shipping mismatch: submitted ${submitted.shippingCost}, calculated ${calculated.shippingCost}`);
  }

  if (Math.abs(submitted.artistLevy - calculated.artistLevy) > tolerance) {
    errors.push(`Artist levy mismatch: submitted ${submitted.artistLevy}, calculated ${calculated.artistLevy}`);
  }

  if (Math.abs(submitted.total - calculated.total) > tolerance) {
    errors.push(`Total mismatch: submitted ${submitted.total}, calculated ${calculated.total}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDiscountAmount(
  discountAmount: number,
  subtotal: number,
  maxDiscountPercent: number = 100
): boolean {
  if (discountAmount < 0) return false;
  if (discountAmount > subtotal) return false;
  if (discountAmount > (subtotal * maxDiscountPercent) / 100) return false;
  return true;
}

export function formatPriceFromOre(ore: number): string {
  const nok = ore / 100;
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nok);
}

export function nokToOre(nok: number): number {
  return Math.round(nok * 100);
}

export function oreToNok(ore: number): number {
  return ore / 100;
}
