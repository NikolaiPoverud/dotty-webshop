import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price in NOK
export function formatPrice(priceInOre: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInOre / 100);
}

// Generate slug from title
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// SEC-016: Generate random alphanumeric suffix for unique slugs
export function generateRandomSuffix(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Norwegian artist levy (kunsteravgift) - 5% for items priced over 2500 NOK
// This is a legal requirement under the Norwegian Visual Artists Copyright Act
export const ARTIST_LEVY_THRESHOLD = 250000; // 2500 NOK in øre
export const ARTIST_LEVY_RATE = 0.05; // 5%

export interface ArtistLevyItem {
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;
  levyAmount: number;
}

/**
 * Calculate artist levy (kunsteravgift) for cart items
 * Returns the total levy amount and breakdown per qualifying item
 */
export function calculateArtistLevy(items: { id: string; title: string; price: number; quantity: number }[]): {
  totalLevy: number;
  items: ArtistLevyItem[];
} {
  const levyItems: ArtistLevyItem[] = [];
  let totalLevy = 0;

  for (const item of items) {
    // Only apply to items over the threshold (2500 NOK = 250000 øre)
    if (item.price > ARTIST_LEVY_THRESHOLD) {
      const levyPerItem = Math.round(item.price * ARTIST_LEVY_RATE);
      const levyAmount = levyPerItem * item.quantity;

      levyItems.push({
        productId: item.id,
        productTitle: item.title,
        price: item.price,
        quantity: item.quantity,
        levyAmount,
      });

      totalLevy += levyAmount;
    }
  }

  return { totalLevy, items: levyItems };
}
