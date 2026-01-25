import type { Locale } from '@/types';
import type { FacetType } from './index';

/**
 * FAQ Content for Programmatic SEO Pages
 *
 * Each facet type has unique FAQs that provide value to users
 * and signal content uniqueness to search engines.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

// ============================================================================
// FAQ Templates by Facet Type
// ============================================================================

export const FACET_FAQS: Record<Locale, Record<FacetType, FaqItem[]>> = {
  no: {
    type: [
      {
        question: 'Hva er forskjellen mellom originaler og trykk?',
        answer: 'Originaler er unike, håndmalte kunstverk som finnes i kun ett eksemplar. Trykk er høykvalitets reproduksjoner i begrenset opplag. Begge er signert av kunstneren og kommer med ekthetssertifikat.',
      },
      {
        question: 'Hvordan vet jeg om et verk er ekte?',
        answer: 'Alle våre kunstverk kommer med signatur fra kunstneren og ekthetssertifikat. Originaler har i tillegg et unikt serienummer og dokumentert proveniens.',
      },
      {
        question: 'Tilbyr dere ramming av kunstverk?',
        answer: 'Ja, vi tilbyr profesjonell ramming på bestilling. Ta kontakt for prisforespørsel og anbefalinger tilpasset ditt valgte verk.',
      },
      {
        question: 'Kan jeg returnere et kunstverk?',
        answer: 'Vi tilbyr 14 dagers angrerett på alle kjøp. Verket må returneres i original emballasje og tilstand for full refusjon.',
      },
      {
        question: 'Hvordan pakkes kunstverk for frakt?',
        answer: 'Alle verk pakkes profesjonelt med syrefritt papir, beskyttende hjørner og robust ytre emballasje. Store originaler sendes med spesialtransport.',
      },
    ],
    year: [
      {
        question: 'Hvorfor varierer stilen fra år til år?',
        answer: 'Kunstnerens uttrykk utvikler seg naturlig over tid. Hvert år representerer en unik fase i den kreative reisen, med nye teknikker og inspirasjon.',
      },
      {
        question: 'Er eldre verk mer verdifulle?',
        answer: 'Verdi avhenger av flere faktorer: sjeldent, størrelse, kompleksitet og kunstnerisk betydning. Både tidlige og nyere verk kan ha betydelig samleverdi.',
      },
      {
        question: 'Kan jeg bestille verk i stilen fra et bestemt år?',
        answer: 'Ta kontakt for kommisjonert kunst. Kunstneren kan diskutere muligheten for å skape nye verk inspirert av tidligere perioder.',
      },
      {
        question: 'Dokumenteres verkenes skapelsesdato?',
        answer: 'Ja, alle verk har dokumentert skapelsesdato som del av proveniensdokumentasjonen og ekthetssertifikatet.',
      },
    ],
    price: [
      {
        question: 'Hva påvirker prisen på et kunstverk?',
        answer: 'Prisen bestemmes av type (original vs. trykk), størrelse, kompleksitet, teknikk og opplagsantall. Originaler er alltid dyrere enn trykk.',
      },
      {
        question: 'Tilbyr dere betalingsplaner?',
        answer: 'Ja, vi tilbyr avbetaling via Klarna for kjøp over 1000 kr. Del betalingen i 3-36 månedlige avdrag.',
      },
      {
        question: 'Er kunstkjøp en god investering?',
        answer: 'Kunstverk kan øke i verdi over tid, spesielt originaler fra etablerte kunstnere. Vi anbefaler å kjøpe kunst du elsker, med verdiøkning som bonus.',
      },
      {
        question: 'Gir dere rabatt ved kjøp av flere verk?',
        answer: 'Ta kontakt for prisforslag ved kjøp av flere verk. Vi tilbyr attraktive pakkepriser for samlere.',
      },
    ],
    size: [
      {
        question: 'Hvordan velger jeg riktig størrelse?',
        answer: 'Mål veggplassen og vurder rommet. En god tommelfingerregel er at kunstverket bør dekke 60-75% av veggbredden over en sofa eller seng.',
      },
      {
        question: 'Kan verk tilpasses til min veggstørrelse?',
        answer: 'For originaler, ta kontakt om kommisjonert kunst i ønsket størrelse. Trykk er tilgjengelige i faste størrelser.',
      },
      {
        question: 'Hvordan fraktes store kunstverk?',
        answer: 'Verk over 100 cm sendes med spesialtransport eller kan hentes på avtalt sted i Oslo-området. Vi koordinerer levering direkte med deg.',
      },
      {
        question: 'Passer små verk i alle rom?',
        answer: 'Små verk passer utmerket som del av en galleri-vegg, i smale ganger, på bad eller som fokuspunkt på en mindre vegg.',
      },
    ],
    collection: [
      {
        question: 'Hva binder verkene i denne samlingen sammen?',
        answer: 'Hver samling har et gjennomgående tema, fargpalett eller konsept som skaper en visuell sammenheng mellom verkene.',
      },
      {
        question: 'Kan jeg kjøpe hele samlingen?',
        answer: 'Ja, ta kontakt for pakkepriser på komplette samlinger. Vi tilbyr betydelige rabatter ved kjøp av flere verk.',
      },
      {
        question: 'Legges det til nye verk i samlingene?',
        answer: 'Samlingene kan utvides over tid med nye verk som passer temaet. Følg oss på sosiale medier for oppdateringer.',
      },
    ],
    'type-year': [
      {
        question: 'Hva kjennetegner originaler fra dette året?',
        answer: 'Hvert år har sine særtrekk i teknikk, fargvalg og motiver. Verkene reflekterer kunstnerens utvikling og inspirasjon i denne perioden.',
      },
      {
        question: 'Finnes det flere originaler fra dette året?',
        answer: 'Antall originaler varierer fra år til år. Kontakt oss for oppdatert informasjon om tilgjengelighet og kommende verk.',
      },
    ],
    'type-size': [
      {
        question: 'Er alle størrelser tilgjengelige som originaler?',
        answer: 'Originaler varierer i størrelse basert på kunstnerens visjon for hvert verk. Kontakt oss for spesifikke størrelsesønsker.',
      },
    ],
    'type-price': [
      {
        question: 'Finnes det originaler i alle prisklasser?',
        answer: 'Originaler starter typisk på høyere prispoeng enn trykk. Ta kontakt for informasjon om innstegsmodeller for originalkunst.',
      },
    ],
  },
  en: {
    type: [
      {
        question: 'What\'s the difference between originals and prints?',
        answer: 'Originals are unique, hand-painted artworks that exist in only one copy. Prints are high-quality limited edition reproductions. Both are signed by the artist and come with a certificate of authenticity.',
      },
      {
        question: 'How do I know if a work is authentic?',
        answer: 'All our artworks come with the artist\'s signature and certificate of authenticity. Originals also have a unique serial number and documented provenance.',
      },
      {
        question: 'Do you offer framing for artworks?',
        answer: 'Yes, we offer professional framing on request. Contact us for pricing and recommendations tailored to your chosen piece.',
      },
      {
        question: 'Can I return an artwork?',
        answer: 'We offer a 14-day return policy on all purchases. The work must be returned in original packaging and condition for a full refund.',
      },
      {
        question: 'How are artworks packaged for shipping?',
        answer: 'All works are professionally packaged with acid-free paper, protective corners, and robust outer packaging. Large originals are shipped with special transport.',
      },
    ],
    year: [
      {
        question: 'Why does the style vary from year to year?',
        answer: 'The artist\'s expression naturally evolves over time. Each year represents a unique phase in the creative journey, with new techniques and inspiration.',
      },
      {
        question: 'Are older works more valuable?',
        answer: 'Value depends on several factors: rarity, size, complexity, and artistic significance. Both early and recent works can have significant collector value.',
      },
      {
        question: 'Can I commission work in the style of a specific year?',
        answer: 'Contact us about commissioned art. The artist can discuss the possibility of creating new works inspired by earlier periods.',
      },
      {
        question: 'Is the creation date documented?',
        answer: 'Yes, all works have a documented creation date as part of the provenance documentation and certificate of authenticity.',
      },
    ],
    price: [
      {
        question: 'What affects the price of an artwork?',
        answer: 'Price is determined by type (original vs. print), size, complexity, technique, and edition size. Originals are always more expensive than prints.',
      },
      {
        question: 'Do you offer payment plans?',
        answer: 'Yes, we offer installment payments via Klarna for purchases over 1000 NOK. Split your payment into 3-36 monthly installments.',
      },
      {
        question: 'Is buying art a good investment?',
        answer: 'Artworks can increase in value over time, especially originals from established artists. We recommend buying art you love, with appreciation as a bonus.',
      },
      {
        question: 'Do you offer discounts for multiple purchases?',
        answer: 'Contact us for pricing on multiple works. We offer attractive package deals for collectors.',
      },
    ],
    size: [
      {
        question: 'How do I choose the right size?',
        answer: 'Measure your wall space and consider the room. A good rule of thumb is that artwork should cover 60-75% of the wall width above a sofa or bed.',
      },
      {
        question: 'Can works be customized to my wall size?',
        answer: 'For originals, contact us about commissioned art in your desired size. Prints are available in fixed sizes.',
      },
      {
        question: 'How are large artworks shipped?',
        answer: 'Works over 100 cm are shipped with special transport or can be picked up at an agreed location in the Oslo area. We coordinate delivery directly with you.',
      },
      {
        question: 'Do small works suit all rooms?',
        answer: 'Small works are excellent as part of a gallery wall, in narrow hallways, in bathrooms, or as a focal point on a smaller wall.',
      },
    ],
    collection: [
      {
        question: 'What ties the works in this collection together?',
        answer: 'Each collection has a consistent theme, color palette, or concept that creates visual cohesion between the works.',
      },
      {
        question: 'Can I buy the entire collection?',
        answer: 'Yes, contact us for package pricing on complete collections. We offer significant discounts on multiple purchases.',
      },
      {
        question: 'Are new works added to collections?',
        answer: 'Collections may expand over time with new works that fit the theme. Follow us on social media for updates.',
      },
    ],
    'type-year': [
      {
        question: 'What characterizes originals from this year?',
        answer: 'Each year has its distinctive features in technique, color choices, and motifs. The works reflect the artist\'s development and inspiration during this period.',
      },
      {
        question: 'Are there more originals from this year?',
        answer: 'The number of originals varies from year to year. Contact us for updated availability information and upcoming works.',
      },
    ],
    'type-size': [
      {
        question: 'Are all sizes available as originals?',
        answer: 'Originals vary in size based on the artist\'s vision for each work. Contact us for specific size requests.',
      },
    ],
    'type-price': [
      {
        question: 'Are there originals in all price ranges?',
        answer: 'Originals typically start at higher price points than prints. Contact us for information about entry-level original art.',
      },
    ],
  },
};

// ============================================================================
// Contextual FAQ Generators
// ============================================================================

/**
 * Get FAQs for a specific facet page
 * Selects 3-5 most relevant FAQs based on context
 */
export function getContextualFaqs(
  locale: Locale,
  facetType: FacetType,
  facetValue: string
): FaqItem[] {
  const baseFaqs = FACET_FAQS[locale][facetType];

  if (!baseFaqs || baseFaqs.length === 0) {
    return [];
  }

  // Return 3-5 FAQs for the facet type
  // Use deterministic selection based on facet value for consistency
  const numFaqs = Math.min(baseFaqs.length, facetValue.length % 2 === 0 ? 4 : 3);

  // Always include first FAQ, then select remaining based on facet value hash
  const selectedFaqs: FaqItem[] = [baseFaqs[0]];

  let hash = 0;
  for (let i = 0; i < facetValue.length; i++) {
    hash = ((hash << 5) - hash) + facetValue.charCodeAt(i);
    hash = hash & hash;
  }

  const remainingFaqs = baseFaqs.slice(1);
  const startIndex = Math.abs(hash) % Math.max(1, remainingFaqs.length);

  for (let i = 0; i < numFaqs - 1 && i < remainingFaqs.length; i++) {
    const index = (startIndex + i) % remainingFaqs.length;
    selectedFaqs.push(remainingFaqs[index]);
  }

  return selectedFaqs;
}

/**
 * Generate FAQ structured data for JSON-LD
 */
export function generateFaqJsonLd(faqs: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
