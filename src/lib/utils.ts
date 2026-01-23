import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(priceInOre: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInOre / 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateRandomSuffix(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (byte) => chars[byte % chars.length]).join('');
}

// Norwegian artist levy (kunsteravgift) - 5% for items over 2500 NOK
export const ARTIST_LEVY_THRESHOLD = 250000;
export const ARTIST_LEVY_RATE = 0.05;

export interface ArtistLevyItem {
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;
  levyAmount: number;
}

export function calculateArtistLevy(
  items: { id: string; title: string; price: number; quantity: number }[]
): {
  totalLevy: number;
  items: ArtistLevyItem[];
} {
  const levyItems: ArtistLevyItem[] = [];
  let totalLevy = 0;

  for (const item of items) {
    if (item.price > ARTIST_LEVY_THRESHOLD) {
      const levyAmount = Math.round(item.price * ARTIST_LEVY_RATE) * item.quantity;

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
