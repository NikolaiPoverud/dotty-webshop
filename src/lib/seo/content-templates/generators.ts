import type { Locale } from '@/types';
import {
  type FacetType,
  type PageContext,
  type ContentComponents,
  INTRO_VARIATIONS,
  CTA_TEXTS,
  EMPTY_STATE_TEXTS,
  interpolate,
  getCountVariation,
  getPriceTierVariation,
  getDeterministicIndex,
} from './index';
import { FACET_FAQS, getContextualFaqs } from './faqs';

/**
 * Content Generators for Programmatic SEO Pages
 *
 * Generates unique, contextual content for each facet page
 * to maximize SEO value and avoid duplicate content penalties.
 */

// ============================================================================
// Meta Title Generators
// ============================================================================

const TITLE_TEMPLATES: Record<Locale, Record<FacetType, string[]>> = {
  no: {
    type: [
      'Kjøp {facetLabel} | Pop-Art fra Dotty.',
      '{facetLabel} | Unik Pop-Art | Dotty.',
      '{facetLabel} – Se Hele Samlingen | Dotty.',
      'Utforsk {facetLabel} | Pop-Art Kunstverk | Dotty.',
    ],
    year: [
      'Pop-Art fra {facetLabel} | Kunstverk | Dotty.',
      'Kunstverk fra {facetLabel} | Se {count} Verk | Dotty.',
      '{facetLabel} Samlingen | Pop-Art | Dotty.',
      'Verk fra {facetLabel} – Utforsk Kunstnerens År | Dotty.',
    ],
    price: [
      'Pop-Art {facetLabel} | Finn Din Kunst | Dotty.',
      'Kunst {facetLabel} | {count} Tilgjengelige Verk | Dotty.',
      '{facetLabel} – Kvalitetskunst til Riktig Pris | Dotty.',
      'Utforsk Kunst {facetLabel} | Pop-Art | Dotty.',
    ],
    size: [
      '{facetLabel} Kunstverk | Pop-Art | Dotty.',
      'Pop-Art i {facetLabel} | Se {count} Verk | Dotty.',
      '{facetLabel} – Finn Perfekt Størrelse | Dotty.',
      '{facetLabel} Pop-Art for Ditt Rom | Dotty.',
    ],
    collection: [
      '{facetLabel} Samlingen | Pop-Art | Dotty.',
      'Utforsk {facetLabel} | Kuratert Kunst | Dotty.',
      '{facetLabel} – {count} Unike Verk | Dotty.',
    ],
    'type-year': [
      '{facetLabel} | Pop-Art | Dotty.',
      '{facetLabel} – {count} Verk | Dotty.',
      'Se {facetLabel} | Kunstverk | Dotty.',
    ],
    'type-size': [
      '{facetLabel} | Pop-Art | Dotty.',
      '{facetLabel} Kunstverk | Se {count} Verk | Dotty.',
    ],
    'type-price': [
      '{facetLabel} | Finn Din Pris | Dotty.',
      '{facetLabel} – {count} Tilgjengelige | Dotty.',
    ],
  },
  en: {
    type: [
      'Buy {facetLabel} | Pop-Art from Dotty.',
      '{facetLabel} | Unique Pop-Art | Dotty.',
      '{facetLabel} – View Full Collection | Dotty.',
      'Explore {facetLabel} | Pop-Art Artworks | Dotty.',
    ],
    year: [
      'Pop-Art from {facetLabel} | Artworks | Dotty.',
      'Artworks from {facetLabel} | See {count} Pieces | Dotty.',
      '{facetLabel} Collection | Pop-Art | Dotty.',
      'Works from {facetLabel} – Explore the Artist\'s Year | Dotty.',
    ],
    price: [
      'Pop-Art {facetLabel} | Find Your Art | Dotty.',
      'Art {facetLabel} | {count} Available Works | Dotty.',
      '{facetLabel} – Quality Art at the Right Price | Dotty.',
      'Explore Art {facetLabel} | Pop-Art | Dotty.',
    ],
    size: [
      '{facetLabel} Artworks | Pop-Art | Dotty.',
      'Pop-Art in {facetLabel} | See {count} Works | Dotty.',
      '{facetLabel} – Find the Perfect Size | Dotty.',
      '{facetLabel} Pop-Art for Your Space | Dotty.',
    ],
    collection: [
      '{facetLabel} Collection | Pop-Art | Dotty.',
      'Explore {facetLabel} | Curated Art | Dotty.',
      '{facetLabel} – {count} Unique Works | Dotty.',
    ],
    'type-year': [
      '{facetLabel} | Pop-Art | Dotty.',
      '{facetLabel} – {count} Pieces | Dotty.',
      'See {facetLabel} | Artworks | Dotty.',
    ],
    'type-size': [
      '{facetLabel} | Pop-Art | Dotty.',
      '{facetLabel} Artworks | See {count} Pieces | Dotty.',
    ],
    'type-price': [
      '{facetLabel} | Find Your Price | Dotty.',
      '{facetLabel} – {count} Available | Dotty.',
    ],
  },
};

// ============================================================================
// Meta Description Generators
// ============================================================================

const DESCRIPTION_TEMPLATES: Record<Locale, Record<FacetType, string[]>> = {
  no: {
    type: [
      'Utforsk {facetLabel} fra Dotty. {count} unike pop-art verk med fri frakt i Norge. Signerte originaler og limiterte trykk.',
      'Kjøp {facetLabel} – håndplukket pop-art samling. {count} verk tilgjengelig. Sikker betaling og rask levering.',
      'Se hele utvalget av {facetLabel}. Fargerik pop-art fra Oslo-basert kunstner. {count} kunstverk venter på deg.',
    ],
    year: [
      'Oppdag kunstverk fra {facetLabel}. {count} unike pop-art verk fra dette året. Se kunstnerens utvikling og signatur-stil.',
      'Utforsk {facetLabel}-samlingen. Pop-art skapt i dette spesielle året. {count} tilgjengelige verk med fri frakt.',
      'Se alle verk fra {facetLabel}. {count} pop-art kunstverk som representerer kunstnerens kreative periode.',
    ],
    price: [
      'Finn pop-art til {facetLabel}. {count} kvalitetsverk som passer budsjettet. Fri frakt og sikker betaling.',
      'Utforsk kunst {facetLabel}. {count} unike pop-art verk i denne prisklassen. Start din samling i dag.',
      'Kvalitetskunst {facetLabel}. Se {count} håndplukkede pop-art verk. Invester i kunst som varer.',
    ],
    size: [
      '{facetLabel} pop-art perfekt for ditt rom. {count} verk tilgjengelig. Finn den rette størrelsen for din vegg.',
      'Se {facetLabel} kunstverk. {count} pop-art verk i denne størrelsen. Fri frakt til hele Norge.',
      'Utforsk {facetLabel} kunst. {count} verk som passer perfekt i ditt hjem eller kontor.',
    ],
    collection: [
      'Utforsk {facetLabel} samlingen. {count} kuraterte pop-art verk som forteller en historie. Se hele kolleksjonen.',
      '{facetLabel} – en eksklusiv samling med {count} kunstverk. Opplev kunstnerens visjon.',
    ],
    'type-year': [
      'Se {facetLabel}. {count} unike verk fra denne perioden. Originale pop-art med fri frakt.',
      'Utforsk {facetLabel}. {count} kunstverk som representerer denne tidsepooken.',
    ],
    'type-size': [
      '{facetLabel} – {count} verk tilgjengelig. Finn perfekt pop-art for ditt rom.',
      'Se {facetLabel}. {count} kunstverk i denne størrelsen. Fri frakt.',
    ],
    'type-price': [
      '{facetLabel} – {count} verk i denne prisklassen. Kvalitetskunst til riktig pris.',
      'Finn {facetLabel}. {count} tilgjengelige verk som passer budsjettet.',
    ],
  },
  en: {
    type: [
      'Explore {facetLabel} from Dotty. {count} unique pop-art pieces with free shipping in Norway. Signed originals and limited prints.',
      'Buy {facetLabel} – handpicked pop-art collection. {count} works available. Secure payment and fast delivery.',
      'View the full selection of {facetLabel}. Colorful pop-art from Oslo-based artist. {count} artworks waiting for you.',
    ],
    year: [
      'Discover artworks from {facetLabel}. {count} unique pop-art pieces from this year. See the artist\'s evolution.',
      'Explore the {facetLabel} collection. Pop-art created in this special year. {count} available works with free shipping.',
      'See all works from {facetLabel}. {count} pop-art pieces representing the artist\'s creative period.',
    ],
    price: [
      'Find pop-art at {facetLabel}. {count} quality works that fit your budget. Free shipping and secure payment.',
      'Explore art {facetLabel}. {count} unique pop-art works in this price range. Start your collection today.',
      'Quality art {facetLabel}. See {count} handpicked pop-art pieces. Invest in art that lasts.',
    ],
    size: [
      '{facetLabel} pop-art perfect for your space. {count} works available. Find the right size for your wall.',
      'See {facetLabel} artworks. {count} pop-art pieces in this size. Free shipping to all of Norway.',
      'Explore {facetLabel} art. {count} works that fit perfectly in your home or office.',
    ],
    collection: [
      'Explore the {facetLabel} collection. {count} curated pop-art works that tell a story. See the full collection.',
      '{facetLabel} – an exclusive collection with {count} artworks. Experience the artist\'s vision.',
    ],
    'type-year': [
      'See {facetLabel}. {count} unique works from this period. Original pop-art with free shipping.',
      'Explore {facetLabel}. {count} artworks representing this era.',
    ],
    'type-size': [
      '{facetLabel} – {count} works available. Find perfect pop-art for your space.',
      'See {facetLabel}. {count} artworks in this size. Free shipping.',
    ],
    'type-price': [
      '{facetLabel} – {count} works in this price range. Quality art at the right price.',
      'Find {facetLabel}. {count} available works that fit your budget.',
    ],
  },
};

// ============================================================================
// Main Generator Functions
// ============================================================================

/**
 * Generate unique meta title for a facet page
 */
export function generateMetaTitle(
  context: PageContext,
  facetLabel: string
): string {
  const templates = TITLE_TEMPLATES[context.locale][context.facetType];
  const index = getDeterministicIndex(context.facetValue, templates.length);

  return interpolate(templates[index], {
    facetLabel,
    count: context.productCount,
  });
}

/**
 * Generate unique meta description for a facet page
 */
export function generateMetaDescription(
  context: PageContext,
  facetLabel: string
): string {
  const templates = DESCRIPTION_TEMPLATES[context.locale][context.facetType];
  const index = getDeterministicIndex(context.facetValue, templates.length);

  return interpolate(templates[index], {
    facetLabel,
    count: context.productCount,
  });
}

/**
 * Generate unique intro paragraph based on context
 */
export function generateIntroParagraph(
  context: PageContext,
  facetLabel: string
): string {
  const variations = INTRO_VARIATIONS[context.locale][context.facetType];

  // Get base variation based on count
  let intro = getCountVariation(context.productCount, variations);

  // Override with price tier variation if applicable
  if (context.facetType === 'price' || context.facetType === 'type-price') {
    const priceTierVariation = getPriceTierVariation(context.facetValue, variations);
    if (priceTierVariation) {
      intro = priceTierVariation;
    }
  }

  return interpolate(intro, {
    facetLabel,
    count: context.productCount,
  });
}

/**
 * Generate contextual CTA text
 */
export function generateCtaText(context: PageContext): string {
  const ctas = CTA_TEXTS[context.locale];
  const index = getDeterministicIndex(context.facetValue, ctas.length);
  return ctas[index];
}

/**
 * Generate empty state text for facet
 */
export function generateEmptyStateText(context: PageContext): string {
  return EMPTY_STATE_TEXTS[context.locale][context.facetType];
}

/**
 * Generate all content components for a facet page
 */
export function generateContentComponents(
  context: PageContext,
  facetLabel: string
): ContentComponents {
  const faqs = getContextualFaqs(context.locale, context.facetType, context.facetValue);

  return {
    metaTitle: generateMetaTitle(context, facetLabel),
    metaDescription: generateMetaDescription(context, facetLabel),
    h1Text: facetLabel, // H1 is usually the facet label itself
    introParagraph: generateIntroParagraph(context, facetLabel),
    faqs,
    ctaText: generateCtaText(context),
    emptyStateText: generateEmptyStateText(context),
  };
}
