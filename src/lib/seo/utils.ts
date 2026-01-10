import type { Locale } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export function getCanonicalUrl(lang: Locale, ...segments: string[]): string {
  const path = segments.filter(Boolean).join('/');
  if (path) {
    return `${BASE_URL}/${lang}/${path}`;
  }
  return `${BASE_URL}/${lang}`;
}

export function getAlternateLanguages(path: string = ''): Record<string, string> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const noUrl = cleanPath ? `${BASE_URL}/no/${cleanPath}` : `${BASE_URL}/no`;
  const enUrl = cleanPath ? `${BASE_URL}/en/${cleanPath}` : `${BASE_URL}/en`;

  return {
    'nb-NO': noUrl,
    'en': enUrl,
  };
}

export function getOgImageUrl(customImage?: string | null): string {
  return customImage || `${BASE_URL}/og-image.jpg`;
}

export function formatPriceForMeta(priceInOre: number): string {
  return (priceInOre / 100).toFixed(0);
}

export function generateProductDescription(
  title: string,
  productType: 'original' | 'print',
  lang: Locale,
  customDescription?: string | null
): string {
  if (customDescription) {
    return customDescription;
  }

  const isNorwegian = lang === 'no';
  const productTypeLabel = productType === 'original'
    ? (isNorwegian ? 'originalt kunstverk' : 'original artwork')
    : (isNorwegian ? 'kunsttrykk' : 'art print');

  if (isNorwegian) {
    return `Kjøp ${title} - unikt ${productTypeLabel} fra Dotty. Pop-art som bringer farge og energi til ditt hjem.`;
  }
  return `Buy ${title} - unique ${productTypeLabel} from Dotty. Pop-art that brings color and energy to your home.`;
}

export function generateCollectionDescription(
  name: string,
  lang: Locale,
  customDescription?: string | null
): string {
  if (customDescription) {
    return customDescription;
  }

  if (lang === 'no') {
    return `Utforsk vår ${name.toLowerCase()} samling. Unike pop-art verk fra Dotty.`;
  }
  return `Explore our ${name.toLowerCase()} collection. Unique pop-art pieces from Dotty.`;
}

interface OgMetadataOptions {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  lang: Locale;
  type?: 'website' | 'article' | 'product';
}

export function createOgMetadata(options: OgMetadataOptions) {
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

interface TwitterMetadataOptions {
  title: string;
  description: string;
  image?: string | null;
}

export function createTwitterMetadata(options: TwitterMetadataOptions) {
  const { title, description, image } = options;

  return {
    card: 'summary_large_image' as const,
    title,
    description,
    images: [getOgImageUrl(image)],
  };
}
