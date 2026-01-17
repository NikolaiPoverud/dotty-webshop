/**
 * Faceted SEO Definitions
 *
 * Defines all facet types, their URL slugs, labels, and configurations
 * for programmatic SEO at scale (100,000+ pages).
 */

import type { Locale, ShippingSize } from '@/types';

// ============================================================================
// Type Facet (original/print)
// ============================================================================

export type TypeFacetValue = 'original' | 'print';

export const TYPE_FACET_SLUGS: Record<Locale, Record<TypeFacetValue, string>> = {
  no: {
    original: 'originaler',
    print: 'trykk',
  },
  en: {
    original: 'originals',
    print: 'prints',
  },
};

export const TYPE_FACET_LABELS: Record<Locale, Record<TypeFacetValue, string>> = {
  no: {
    original: 'Originale Kunstverk',
    print: 'Kunsttrykk',
  },
  en: {
    original: 'Original Artworks',
    print: 'Art Prints',
  },
};

export const TYPE_FACET_DESCRIPTIONS: Record<Locale, Record<TypeFacetValue, string>> = {
  no: {
    original: 'Utforsk våre originale, håndmalte pop-art kunstverk. Hvert verk er unikt og signert av kunstneren.',
    print: 'Oppdag våre kunsttrykk i begrenset opplag. Høykvalitets reproduksjoner av populære pop-art verk.',
  },
  en: {
    original: 'Explore our original, hand-painted pop-art artworks. Each piece is unique and signed by the artist.',
    print: 'Discover our limited edition art prints. High-quality reproductions of popular pop-art pieces.',
  },
};

// Reverse lookup: slug -> db value
export function getTypeValueFromSlug(slug: string, locale: Locale): TypeFacetValue | null {
  const slugs = TYPE_FACET_SLUGS[locale];
  for (const [value, s] of Object.entries(slugs)) {
    if (s === slug) return value as TypeFacetValue;
  }
  return null;
}

// ============================================================================
// Price Range Facet
// ============================================================================

export interface PriceRange {
  slug: string;
  minPrice: number | null; // in øre (null = no minimum)
  maxPrice: number | null; // in øre (null = no maximum)
}

export const PRICE_RANGES: PriceRange[] = [
  { slug: 'under-2500', minPrice: null, maxPrice: 250000 },
  { slug: '2500-5000', minPrice: 250000, maxPrice: 500000 },
  { slug: '5000-10000', minPrice: 500000, maxPrice: 1000000 },
  { slug: '10000-25000', minPrice: 1000000, maxPrice: 2500000 },
  { slug: 'over-25000', minPrice: 2500000, maxPrice: null },
];

export const PRICE_RANGE_LABELS: Record<Locale, Record<string, string>> = {
  no: {
    'under-2500': 'Under 2 500 kr',
    '2500-5000': '2 500 - 5 000 kr',
    '5000-10000': '5 000 - 10 000 kr',
    '10000-25000': '10 000 - 25 000 kr',
    'over-25000': 'Over 25 000 kr',
  },
  en: {
    'under-2500': 'Under 2,500 NOK',
    '2500-5000': '2,500 - 5,000 NOK',
    '5000-10000': '5,000 - 10,000 NOK',
    '10000-25000': '10,000 - 25,000 NOK',
    'over-25000': 'Over 25,000 NOK',
  },
};

export const PRICE_RANGE_DESCRIPTIONS: Record<Locale, Record<string, string>> = {
  no: {
    'under-2500': 'Kunsttrykk og mindre verk til gode priser. Perfekt for den som vil starte sin kunstsamling.',
    '2500-5000': 'Kvalitetskunst i mellomklassen. Trykk og mindre originaler til rimelige priser.',
    '5000-10000': 'Premium kunsttrykk og mellomstore originaler. Ideelt for de som søker noe ekstra.',
    '10000-25000': 'Eksklusive kunstverk for den kresne samleren. Originaler og signerte verk.',
    'over-25000': 'Luksuskunst og mesterverk. Store originaler og eksklusive unika.',
  },
  en: {
    'under-2500': 'Art prints and smaller works at great prices. Perfect for starting your art collection.',
    '2500-5000': 'Quality art in the mid-range. Prints and smaller originals at reasonable prices.',
    '5000-10000': 'Premium art prints and medium-sized originals. Ideal for those seeking something extra.',
    '10000-25000': 'Exclusive artworks for the discerning collector. Originals and signed pieces.',
    'over-25000': 'Luxury art and masterpieces. Large originals and exclusive unique pieces.',
  },
};

export function getPriceRange(slug: string): PriceRange | null {
  return PRICE_RANGES.find((r) => r.slug === slug) ?? null;
}

// ============================================================================
// Size (Shipping Size) Facet
// ============================================================================

export const SIZE_FACET_SLUGS: Record<Locale, Record<ShippingSize, string>> = {
  no: {
    small: 'liten',
    medium: 'medium',
    large: 'stor',
    oversized: 'ekstra-stor',
  },
  en: {
    small: 'small',
    medium: 'medium',
    large: 'large',
    oversized: 'extra-large',
  },
};

export const SIZE_FACET_LABELS: Record<Locale, Record<ShippingSize, string>> = {
  no: {
    small: 'Liten (opptil A4)',
    medium: 'Medium (opptil A2)',
    large: 'Stor (opptil 100 cm)',
    oversized: 'Ekstra stor (over 100 cm)',
  },
  en: {
    small: 'Small (up to A4)',
    medium: 'Medium (up to A2)',
    large: 'Large (up to 100 cm)',
    oversized: 'Extra Large (over 100 cm)',
  },
};

export const SIZE_FACET_DESCRIPTIONS: Record<Locale, Record<ShippingSize, string>> = {
  no: {
    small: 'Kompakte kunstverk perfekte for mindre rom. Passer i standard postkasse.',
    medium: 'Mellomstore verk ideelle for stue eller kontor. Leveres i rør eller flat eske.',
    large: 'Store kunstverk som gjør inntrykk. Krever spesialhåndtering ved frakt.',
    oversized: 'Monumentale verk for store rom. Spesialtransport eller henting.',
  },
  en: {
    small: 'Compact artworks perfect for smaller spaces. Fits in standard mailbox.',
    medium: 'Medium-sized works ideal for living rooms or offices. Shipped in tube or flat box.',
    large: 'Large artworks that make an impression. Requires special handling for shipping.',
    oversized: 'Monumental works for large spaces. Special transport or pickup required.',
  },
};

export function getSizeValueFromSlug(slug: string, locale: Locale): ShippingSize | null {
  const slugs = SIZE_FACET_SLUGS[locale];
  for (const [value, s] of Object.entries(slugs)) {
    if (s === slug) return value as ShippingSize;
  }
  return null;
}

// ============================================================================
// Year Facet
// ============================================================================

// Year facets are generated dynamically from the database
// But we define the URL pattern and label format

export const YEAR_FACET_LABELS: Record<Locale, (year: number) => string> = {
  no: (year) => `Kunstverk fra ${year}`,
  en: (year) => `Artworks from ${year}`,
};

export const YEAR_FACET_DESCRIPTIONS: Record<Locale, (year: number) => string> = {
  no: (year) => `Utforsk pop-art kunstverk skapt i ${year}. Se hva kunstneren laget dette året.`,
  en: (year) => `Explore pop-art artworks created in ${year}. See what the artist made this year.`,
};

// ============================================================================
// All Facets Configuration
// ============================================================================

export type FacetType = 'type' | 'year' | 'price' | 'size';

export const FACET_BASE_PATHS: Record<FacetType, string> = {
  type: 'type',
  year: 'year',
  price: 'price',
  size: 'size',
};

export const FACET_PAGE_PRIORITIES: Record<FacetType, number> = {
  type: 0.85,   // High priority - main category pages
  year: 0.7,    // Medium priority - temporal organization
  price: 0.6,   // Lower priority - supplementary filtering
  size: 0.6,    // Lower priority - supplementary filtering
};

export const FACET_CHANGE_FREQUENCIES: Record<FacetType, 'daily' | 'weekly' | 'monthly'> = {
  type: 'weekly',
  year: 'weekly',
  price: 'weekly',
  size: 'weekly',
};

// Minimum products required to index a faceted page (avoid thin content)
export const MIN_PRODUCTS_FOR_INDEX = 3;

// ============================================================================
// Static Params Generation Helpers
// ============================================================================

export function getAllTypeFacetParams(): Array<{ type: string }> {
  const params: Array<{ type: string }> = [];
  for (const locale of ['no', 'en'] as Locale[]) {
    for (const slug of Object.values(TYPE_FACET_SLUGS[locale])) {
      params.push({ type: slug });
    }
  }
  // Deduplicate (in case slugs are same across locales)
  return [...new Map(params.map((p) => [p.type, p])).values()];
}

export function getAllPriceFacetParams(): Array<{ range: string }> {
  return PRICE_RANGES.map((r) => ({ range: r.slug }));
}

export function getAllSizeFacetParams(): Array<{ size: string }> {
  const params: Array<{ size: string }> = [];
  for (const locale of ['no', 'en'] as Locale[]) {
    for (const slug of Object.values(SIZE_FACET_SLUGS[locale])) {
      params.push({ size: slug });
    }
  }
  return [...new Map(params.map((p) => [p.size, p])).values()];
}
