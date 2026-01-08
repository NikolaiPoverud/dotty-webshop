import type { Locale } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

/**
 * Get the canonical URL for a page
 */
export function getCanonicalUrl(lang: Locale, ...segments: string[]): string {
  const path = segments.filter(Boolean).join('/');
  return path ? `${BASE_URL}/${lang}/${path}` : `${BASE_URL}/${lang}`;
}

/**
 * Get alternate language URLs for hreflang tags
 */
export function getAlternateLanguages(path: string = ''): Record<string, string> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return {
    'nb-NO': cleanPath ? `${BASE_URL}/no/${cleanPath}` : `${BASE_URL}/no`,
    'en': cleanPath ? `${BASE_URL}/en/${cleanPath}` : `${BASE_URL}/en`,
  };
}

/**
 * Get the OG image URL
 */
export function getOgImageUrl(customImage?: string | null): string {
  return customImage || `${BASE_URL}/og-image.jpg`;
}

/**
 * Format price for meta tags (price in ore to decimal string)
 */
export function formatPriceForMeta(priceInOre: number): string {
  return (priceInOre / 100).toFixed(0);
}

/**
 * Generate product meta description
 */
export function generateProductDescription(
  title: string,
  productType: 'original' | 'print',
  lang: Locale,
  customDescription?: string | null
): string {
  if (customDescription) return customDescription;

  const productTypeLabel = productType === 'original'
    ? (lang === 'no' ? 'originalt kunstverk' : 'original artwork')
    : (lang === 'no' ? 'kunsttrykk' : 'art print');

  return lang === 'no'
    ? `Kjøp ${title} - unikt ${productTypeLabel} fra Dotty. Pop-art som bringer farge og energi til ditt hjem.`
    : `Buy ${title} - unique ${productTypeLabel} from Dotty. Pop-art that brings color and energy to your home.`;
}

/**
 * Generate collection meta description
 */
export function generateCollectionDescription(
  name: string,
  lang: Locale,
  customDescription?: string | null
): string {
  if (customDescription) return customDescription;

  return lang === 'no'
    ? `Utforsk vår ${name.toLowerCase()} samling. Unike pop-art verk fra Dotty.`
    : `Explore our ${name.toLowerCase()} collection. Unique pop-art pieces from Dotty.`;
}

/**
 * Create standard OpenGraph metadata
 */
export function createOgMetadata(options: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  lang: Locale;
  type?: 'website' | 'article' | 'product';
}) {
  const { title, description, url, image, lang, type = 'website' } = options;

  return {
    title,
    description,
    type,
    locale: lang === 'no' ? 'nb_NO' : 'en_US',
    url,
    siteName: 'Dotty.',
    images: [{
      url: getOgImageUrl(image),
      width: 1200,
      height: 630,
      alt: title,
    }],
  };
}

/**
 * Create standard Twitter metadata
 */
export function createTwitterMetadata(options: {
  title: string;
  description: string;
  image?: string | null;
}) {
  const { title, description, image } = options;

  return {
    card: 'summary_large_image' as const,
    title,
    description,
    images: [getOgImageUrl(image)],
  };
}
