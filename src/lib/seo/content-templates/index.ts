import type { Locale, ShippingSize } from '@/types';

/**
 * SEO Content Templates System
 *
 * Provides unique, contextual content for programmatic SEO pages
 * to avoid duplicate content issues across 100k+ facet pages.
 */

// ============================================================================
// Types
// ============================================================================

export type FacetType = 'type' | 'year' | 'price' | 'size' | 'collection' | 'type-year' | 'type-size' | 'type-price';

export interface PageContext {
  locale: Locale;
  facetType: FacetType;
  facetValue: string;
  productCount: number;
  minPrice?: number;
  maxPrice?: number;
  avgPrice?: number;
  relatedFacets?: Array<{ type: string; value: string; count: number }>;
}

export interface ContentComponents {
  metaTitle: string;
  metaDescription: string;
  h1Text: string;
  introParagraph: string;
  seoFooterText?: string;
  faqs: Array<{ question: string; answer: string }>;
  ctaText?: string;
  emptyStateText: string;
}

export interface ContentVariation {
  // Product count based variations
  lowCount: string;      // < 5 products
  mediumCount: string;   // 5-20 products
  highCount: string;     // > 20 products

  // Price tier variations
  budget?: string;       // Low price tier
  premium?: string;      // High price tier
}

// ============================================================================
// Content Templates by Facet Type
// ============================================================================

export const INTRO_VARIATIONS: Record<Locale, Record<FacetType, ContentVariation>> = {
  no: {
    type: {
      lowCount: 'Oppdag våre eksklusive {facetLabel}. Med kun {count} tilgjengelige verk, er hvert stykke en sjelden mulighet.',
      mediumCount: 'Utforsk vår nøye kuraterte samling av {facetLabel}. {count} unike kunstverk venter på deg.',
      highCount: 'Bla gjennom vår omfattende samling av {facetLabel}. Med over {count} verk å velge mellom, finner du garantert noe perfekt for deg.',
    },
    year: {
      lowCount: 'Opplev sjeldne kunstverk fra {facetLabel}. Kun {count} verk fra dette spesielle året.',
      mediumCount: 'Utforsk kunstnerens kreative utvikling i {facetLabel}. {count} unike verk fra dette året.',
      highCount: '{facetLabel} var et produktivt år. Se alle {count} kunstverk skapt i denne perioden.',
    },
    price: {
      lowCount: 'Finn rimelig pop-art til {facetLabel}. {count} tilgjengelige verk i denne prisklassen.',
      mediumCount: 'Kvalitetskunst til {facetLabel}. {count} verk som passer ditt budsjett.',
      highCount: 'Stort utvalg i prisklassen {facetLabel}. Over {count} kunstverk å velge mellom.',
      budget: 'Start din kunstsamling uten å bryte budsjettet. Vår {facetLabel}-kategori gir deg kvalitet til en overkommelig pris.',
      premium: 'For den kresne samleren: Eksklusiv kunst over {facetLabel}. Invester i verk som øker i verdi.',
    },
    size: {
      lowCount: 'Eksklusive {facetLabel} kunstverk. Kun {count} tilgjengelige i denne størrelsen.',
      mediumCount: '{facetLabel} kunstverk perfekt for ditt rom. {count} alternativer å velge mellom.',
      highCount: 'Bredt utvalg av {facetLabel} kunst. Over {count} verk i denne størrelseskategorien.',
    },
    collection: {
      lowCount: 'En eksklusiv samling med kun {count} verk. Hvert stykke er nøye utvalgt.',
      mediumCount: 'Utforsk denne kuraterte samlingen. {count} kunstverk som forteller en historie.',
      highCount: 'En omfattende samling med {count}+ kunstverk. Dykk ned i kunstnerens visjon.',
    },
    'type-year': {
      lowCount: 'Sjeldne {facetLabel} - kun {count} eksisterer fra dette året.',
      mediumCount: '{facetLabel} - {count} unike verk som representerer denne perioden.',
      highCount: 'Utforsk alle {count} {facetLabel} fra dette året.',
    },
    'type-size': {
      lowCount: 'Eksklusive {facetLabel} - kun {count} tilgjengelige.',
      mediumCount: '{count} {facetLabel} perfekt for ditt rom.',
      highCount: 'Stort utvalg av {facetLabel} - over {count} verk.',
    },
    'type-price': {
      lowCount: 'Sjeldne {facetLabel} i denne prisklassen.',
      mediumCount: '{count} {facetLabel} som passer ditt budsjett.',
      highCount: 'Over {count} {facetLabel} tilgjengelig i denne prisklassen.',
    },
  },
  en: {
    type: {
      lowCount: 'Discover our exclusive {facetLabel}. With only {count} available works, each piece is a rare opportunity.',
      mediumCount: 'Explore our carefully curated collection of {facetLabel}. {count} unique artworks await you.',
      highCount: 'Browse our extensive collection of {facetLabel}. With over {count} pieces to choose from, you\'re sure to find something perfect.',
    },
    year: {
      lowCount: 'Experience rare artworks from {facetLabel}. Only {count} pieces from this special year.',
      mediumCount: 'Explore the artist\'s creative evolution in {facetLabel}. {count} unique works from this year.',
      highCount: '{facetLabel} was a productive year. See all {count} artworks created during this period.',
    },
    price: {
      lowCount: 'Find affordable pop-art at {facetLabel}. {count} available works in this price range.',
      mediumCount: 'Quality art at {facetLabel}. {count} pieces that fit your budget.',
      highCount: 'Wide selection in the {facetLabel} range. Over {count} artworks to choose from.',
      budget: 'Start your art collection without breaking the bank. Our {facetLabel} category offers quality at an accessible price.',
      premium: 'For the discerning collector: Exclusive art over {facetLabel}. Invest in pieces that appreciate.',
    },
    size: {
      lowCount: 'Exclusive {facetLabel} artworks. Only {count} available in this size.',
      mediumCount: '{facetLabel} artworks perfect for your space. {count} options to choose from.',
      highCount: 'Wide selection of {facetLabel} art. Over {count} pieces in this size category.',
    },
    collection: {
      lowCount: 'An exclusive collection with only {count} works. Each piece carefully selected.',
      mediumCount: 'Explore this curated collection. {count} artworks that tell a story.',
      highCount: 'A comprehensive collection with {count}+ artworks. Dive into the artist\'s vision.',
    },
    'type-year': {
      lowCount: 'Rare {facetLabel} - only {count} exist from this year.',
      mediumCount: '{facetLabel} - {count} unique works representing this period.',
      highCount: 'Explore all {count} {facetLabel} from this year.',
    },
    'type-size': {
      lowCount: 'Exclusive {facetLabel} - only {count} available.',
      mediumCount: '{count} {facetLabel} perfect for your space.',
      highCount: 'Large selection of {facetLabel} - over {count} pieces.',
    },
    'type-price': {
      lowCount: 'Rare {facetLabel} in this price range.',
      mediumCount: '{count} {facetLabel} that fit your budget.',
      highCount: 'Over {count} {facetLabel} available in this price range.',
    },
  },
};

// ============================================================================
// CTA Text Variations
// ============================================================================

export const CTA_TEXTS: Record<Locale, string[]> = {
  no: [
    'Se hele samlingen',
    'Utforsk kunsten',
    'Finn ditt mesterverk',
    'Start din kunstsamling i dag',
    'Bla gjennom verkene',
  ],
  en: [
    'View full collection',
    'Explore the art',
    'Find your masterpiece',
    'Start your art collection today',
    'Browse the works',
  ],
};

// ============================================================================
// Empty State Variations
// ============================================================================

export const EMPTY_STATE_TEXTS: Record<Locale, Record<FacetType, string>> = {
  no: {
    type: 'Ingen kunstverk i denne kategorien for øyeblikket. Sjekk tilbake snart eller utforsk våre andre samlinger.',
    year: 'Ingen kunstverk fra dette året tilgjengelig. Utforsk andre årganger eller ta kontakt for spesialbestillinger.',
    price: 'Ingen kunstverk i denne prisklassen akkurat nå. Se våre andre priskategorier for alternativer.',
    size: 'Ingen kunstverk i denne størrelsen for øyeblikket. Utforsk andre størrelser eller kontakt oss for tilpassede løsninger.',
    collection: 'Denne samlingen er tom for øyeblikket. Utforsk våre andre samlinger.',
    'type-year': 'Ingen verk i denne kombinasjonen. Prøv andre filtre.',
    'type-size': 'Ingen verk i denne kombinasjonen. Prøv andre filtre.',
    'type-price': 'Ingen verk i denne kombinasjonen. Prøv andre filtre.',
  },
  en: {
    type: 'No artworks in this category at the moment. Check back soon or explore our other collections.',
    year: 'No artworks from this year available. Explore other years or contact us for custom commissions.',
    price: 'No artworks in this price range right now. Browse our other price categories for alternatives.',
    size: 'No artworks in this size at the moment. Explore other sizes or contact us for custom solutions.',
    collection: 'This collection is currently empty. Explore our other collections.',
    'type-year': 'No works in this combination. Try other filters.',
    'type-size': 'No works in this combination. Try other filters.',
    'type-price': 'No works in this combination. Try other filters.',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Interpolate variables into template string
 */
export function interpolate(
  template: string,
  variables: Record<string, string | number>
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
}

/**
 * Get content variation based on product count
 */
export function getCountVariation(
  count: number,
  variations: ContentVariation
): string {
  if (count < 5) return variations.lowCount;
  if (count <= 20) return variations.mediumCount;
  return variations.highCount;
}

/**
 * Get price tier variation if applicable
 */
export function getPriceTierVariation(
  priceRange: string,
  variations: ContentVariation
): string | undefined {
  if (priceRange === 'under-2500' && variations.budget) {
    return variations.budget;
  }
  if (priceRange === 'over-25000' && variations.premium) {
    return variations.premium;
  }
  return undefined;
}

/**
 * Generate a pseudo-random but deterministic index based on facet value
 * Used to select variations consistently for the same page
 */
export function getDeterministicIndex(facetValue: string, arrayLength: number): number {
  let hash = 0;
  for (let i = 0; i < facetValue.length; i++) {
    hash = ((hash << 5) - hash) + facetValue.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % arrayLength;
}

// Re-export generators
export * from './generators';
export * from './faqs';
