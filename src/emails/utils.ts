import { formatPrice as formatPriceBase } from '@/lib/utils';

/**
 * Format price for email display (simplified format without currency symbol prefix)
 * Uses "X kr" format for cleaner email rendering
 */
export function formatPrice(priceInOre: number): string {
  return `${(priceInOre / 100).toLocaleString('no-NO')} kr`;
}

/**
 * Re-export the base formatPrice for cases where full currency format is needed
 */
export { formatPriceBase };

/**
 * Format date for email display (e.g., "15. januar 2024")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format date with time for email display (e.g., "15. jan 2024, 14:30")
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('no-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Supported shipping carriers with their tracking URLs
 */
export const SHIPPING_CARRIERS = [
  { id: 'posten', label: 'Posten / Bring' },
  { id: 'helthjem', label: 'Helthjem' },
  { id: 'postnord', label: 'PostNord' },
] as const;

export type ShippingCarrierId = typeof SHIPPING_CARRIERS[number]['id'];

/**
 * Get tracking URL for common Norwegian carriers
 */
export function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierLower = carrier.toLowerCase();

  if (carrierLower.includes('posten') || carrierLower.includes('bring')) {
    return `https://sporing.bring.no/sporing/${trackingNumber}`;
  }
  if (carrierLower.includes('helthjem')) {
    return `https://www.helthjem.no/sporing?trackingnumber=${trackingNumber}`;
  }
  if (carrierLower.includes('postnord')) {
    return `https://www.postnord.no/sporpakke?id=${trackingNumber}`;
  }
  if (carrierLower.includes('dhl')) {
    return `https://www.dhl.com/no-no/home/tracking.html?tracking-id=${trackingNumber}`;
  }
  if (carrierLower.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} ${trackingNumber} sporing`)}`;
}
