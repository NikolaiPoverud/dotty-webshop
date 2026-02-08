import type { Locale } from '@/types';

export const SEO_CONFIG = {
  domains: {
    no: process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no',
    en: process.env.NEXT_PUBLIC_DOMAIN_EN || 'https://dottyartworks.com',
  },
  defaultLocale: 'no' as Locale,
  locales: ['no', 'en'] as Locale[],
  siteName: 'Dotty.',
  defaultOgImage: '/og-image.jpg',
  twitterHandle: '@dottyartwork',
} as const;

export const PAGINATION_CONFIG = {
  productsPerPage: 24,
  maxPagesInSitemap: 500, // Limit sitemap entries per file
  revalidateSeconds: 3600, // 1 hour for listing pages
  productRevalidateSeconds: 86400, // 24 hours for product pages
} as const;

export type PageType =
  | 'home'
  | 'shop'
  | 'shop-paginated'
  | 'product'
  | 'collection'
  | 'collection-paginated'
  | 'sold'
  | 'about'
  | 'faq'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'guide-index'
  | 'guide'
  // Faceted pages
  | 'facet-type'
  | 'facet-year'
  | 'facet-price'
  | 'facet-size'
  | 'facet-type-year';

export const SEO_TEMPLATES: Record<PageType, {
  titleTemplate: { no: string; en: string };
  descriptionTemplate: { no: string; en: string };
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}> = {
  home: {
    titleTemplate: {
      no: 'Dotty. | Kjøp Pop-Art fra Norsk Kunstner',
      en: 'Dotty. | Buy Pop-Art from Norwegian Artist',
    },
    descriptionTemplate: {
      no: 'Kjøp unike pop-art malerier, plakater og kunsttrykk. Håndmalte originaler og signerte limited edition trykk fra norsk kunstner i Oslo. Kunstgaver og veggkunst med personlighet.',
      en: 'Buy unique pop-art paintings, posters and art prints. Hand-painted originals and signed limited edition prints from Norwegian artist in Oslo. Art gifts and wall art with personality.',
    },
    priority: 1.0,
    changeFrequency: 'daily',
  },
  shop: {
    titleTemplate: {
      no: 'Kunstbutikk | Malerier, Plakater & Pop-Art | Dotty.',
      en: 'Art Shop | Paintings, Posters & Pop-Art | Dotty.',
    },
    descriptionTemplate: {
      no: 'Kjøp signerte pop-art malerier, kunstplakater og veggkunst. Håndmalte originaler og limited edition trykk fra norsk kunstner. Frakt 99 kr.',
      en: 'Buy signed pop-art paintings, art posters and wall art. Hand-painted originals and limited edition prints from Norwegian artist. Shipping 99 kr.',
    },
    priority: 0.9,
    changeFrequency: 'daily',
  },
  'shop-paginated': {
    titleTemplate: {
      no: 'Shop Side {page} | Alle Kunstverk | Dotty.',
      en: 'Shop Page {page} | All Artworks | Dotty.',
    },
    descriptionTemplate: {
      no: 'Utforsk side {page} av vår pop-art samling. Originaler og trykk.',
      en: 'Explore page {page} of our pop-art collection. Originals and prints.',
    },
    priority: 0.7,
    changeFrequency: 'weekly',
  },
  product: {
    titleTemplate: {
      no: '{title} | Kjøp {type} | Dotty.',
      en: '{title} | Buy {type} | Dotty.',
    },
    descriptionTemplate: {
      no: 'Kjøp {title} – signert {type} pop-art fra norsk kunstner. {description} Frakt 99 kr.',
      en: 'Buy {title} – signed {type} pop-art from Norwegian artist. {description} Shipping 99 kr.',
    },
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  collection: {
    titleTemplate: {
      no: '{name} Samling | Pop-Art | Dotty.',
      en: '{name} Collection | Pop-Art | Dotty.',
    },
    descriptionTemplate: {
      no: 'Utforsk {name} samlingen. {description}',
      en: 'Explore the {name} collection. {description}',
    },
    priority: 0.85,
    changeFrequency: 'weekly',
  },
  'collection-paginated': {
    titleTemplate: {
      no: '{name} Side {page} | Pop-Art | Dotty.',
      en: '{name} Page {page} | Pop-Art | Dotty.',
    },
    descriptionTemplate: {
      no: 'Side {page} av {name} samlingen.',
      en: 'Page {page} of the {name} collection.',
    },
    priority: 0.6,
    changeFrequency: 'weekly',
  },
  sold: {
    titleTemplate: {
      no: 'Solgte Kunstverk | Tidligere Pop-Art Verk | Dotty.',
      en: 'Sold Artworks | Previous Pop-Art Works | Dotty.',
    },
    descriptionTemplate: {
      no: 'Se solgte pop-art kunstverk fra norsk kunstner Dotty. Håndmalte originaler og signerte trykk. Interessert i lignende verk? Ta kontakt.',
      en: 'View sold pop-art artworks from Norwegian artist Dotty. Hand-painted originals and signed prints. Interested in similar pieces? Get in touch.',
    },
    priority: 0.5,
    changeFrequency: 'weekly',
  },
  about: {
    titleTemplate: {
      no: 'Om Kunstneren | Norsk Pop-Art Kunstner fra Oslo | Dotty.',
      en: 'About the Artist | Norwegian Pop-Art Artist from Oslo | Dotty.',
    },
    descriptionTemplate: {
      no: 'Møt Dotty – norsk kunstner fra Oslo som skaper fargerik, håndmalt pop-art. Originale kunstverk og signerte limited edition trykk.',
      en: 'Meet Dotty – Norwegian artist from Oslo creating colorful, hand-painted pop-art. Original artworks and signed limited edition prints.',
    },
    priority: 0.6,
    changeFrequency: 'monthly',
  },
  faq: {
    titleTemplate: {
      no: 'Ofte Stilte Spørsmål | Dotty.',
      en: 'Frequently Asked Questions | Dotty.',
    },
    descriptionTemplate: {
      no: 'Svar på vanlige spørsmål om bestilling, frakt og kunstverk.',
      en: 'Answers to common questions about ordering, shipping, and artwork.',
    },
    priority: 0.5,
    changeFrequency: 'monthly',
  },
  contact: {
    titleTemplate: {
      no: 'Kontakt | Dotty.',
      en: 'Contact | Dotty.',
    },
    descriptionTemplate: {
      no: 'Ta kontakt med Dotty for spørsmål om kunstverk eller bestillinger.',
      en: 'Contact Dotty for questions about artwork or orders.',
    },
    priority: 0.5,
    changeFrequency: 'monthly',
  },
  privacy: {
    titleTemplate: {
      no: 'Personvern | Dotty.',
      en: 'Privacy Policy | Dotty.',
    },
    descriptionTemplate: {
      no: 'Les vår personvernerklæring.',
      en: 'Read our privacy policy.',
    },
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  terms: {
    titleTemplate: {
      no: 'Vilkår og Betingelser | Dotty.',
      en: 'Terms and Conditions | Dotty.',
    },
    descriptionTemplate: {
      no: 'Les våre vilkår og betingelser.',
      en: 'Read our terms and conditions.',
    },
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  'guide-index': {
    titleTemplate: {
      no: 'Kunstguider | Dotty.',
      en: 'Art Guides | Dotty.',
    },
    descriptionTemplate: {
      no: 'Utforsk våre guider om pop-art, kunstpleie og tips for å velge kunst til hjemmet.',
      en: 'Explore our guides about pop-art, art care, and tips for choosing art for your home.',
    },
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  guide: {
    titleTemplate: {
      no: '{title} | Kunstguide | Dotty.',
      en: '{title} | Art Guide | Dotty.',
    },
    descriptionTemplate: {
      no: '{description}',
      en: '{description}',
    },
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  'facet-type': {
    titleTemplate: {
      no: 'Kjøp {type} | Pop-Art | Dotty.',
      en: 'Buy {type} | Pop-Art | Dotty.',
    },
    descriptionTemplate: {
      no: 'Utforsk vår samling av {type}. {description}',
      en: 'Explore our collection of {type}. {description}',
    },
    priority: 0.85,
    changeFrequency: 'weekly',
  },
  'facet-year': {
    titleTemplate: {
      no: 'Pop-Art fra {year} | Kunstverk | Dotty.',
      en: 'Pop-Art from {year} | Artworks | Dotty.',
    },
    descriptionTemplate: {
      no: 'Se alle kunstverk skapt i {year}. {count} unike pop-art verk fra dette året.',
      en: 'View all artworks created in {year}. {count} unique pop-art pieces from this year.',
    },
    priority: 0.7,
    changeFrequency: 'weekly',
  },
  'facet-price': {
    titleTemplate: {
      no: 'Pop-Art {range} | Kunstverk | Dotty.',
      en: 'Pop-Art {range} | Artworks | Dotty.',
    },
    descriptionTemplate: {
      no: '{description} Finn din perfekte kunstverk innenfor budsjettet.',
      en: '{description} Find your perfect artwork within your budget.',
    },
    priority: 0.6,
    changeFrequency: 'weekly',
  },
  'facet-size': {
    titleTemplate: {
      no: '{size} Kunstverk | Pop-Art | Dotty.',
      en: '{size} Artworks | Pop-Art | Dotty.',
    },
    descriptionTemplate: {
      no: 'Utforsk {size} kunstverk. {description}',
      en: 'Explore {size} artworks. {description}',
    },
    priority: 0.6,
    changeFrequency: 'weekly',
  },
  'facet-type-year': {
    titleTemplate: {
      no: '{type} fra {year} | Pop-Art | Dotty.',
      en: '{type} from {year} | Pop-Art | Dotty.',
    },
    descriptionTemplate: {
      no: 'Utforsk {type} skapt i {year}. {count} unike pop-art verk.',
      en: 'Explore {type} created in {year}. {count} unique pop-art pieces.',
    },
    priority: 0.65,
    changeFrequency: 'weekly',
  },
};
export const SCHEMA_TYPES: Record<PageType, string[]> = {
  home: ['Organization', 'WebSite'],
  shop: ['CollectionPage', 'BreadcrumbList'],
  'shop-paginated': ['CollectionPage', 'BreadcrumbList'],
  product: ['Product', 'BreadcrumbList'],
  collection: ['CollectionPage', 'BreadcrumbList'],
  'collection-paginated': ['CollectionPage', 'BreadcrumbList'],
  sold: ['CollectionPage', 'BreadcrumbList'],
  about: ['AboutPage', 'Person', 'BreadcrumbList'],
  faq: ['FAQPage', 'BreadcrumbList'],
  contact: ['ContactPage', 'BreadcrumbList'],
  privacy: ['WebPage', 'BreadcrumbList'],
  terms: ['WebPage', 'BreadcrumbList'],
  'guide-index': ['CollectionPage', 'BreadcrumbList'],
  guide: ['Article', 'FAQPage', 'BreadcrumbList'],
  'facet-type': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  'facet-year': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  'facet-price': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  'facet-size': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  'facet-type-year': ['CollectionPage', 'ItemList', 'BreadcrumbList'],
};

export const INTERNAL_LINKING = {
  hubs: ['shop', 'collection', 'facet-type', 'facet-year'] as PageType[],
  maxRelatedProducts: 6,
  maxRelatedCollections: 4,
  maxRelatedFacets: 4,
  maxBreadcrumbDepth: 4,
} as const;

export function getDomainForLocale(locale: Locale): string {
  return SEO_CONFIG.domains[locale];
}

export function buildCanonicalUrl(locale: Locale, path: string): string {
  const domain = getDomainForLocale(locale);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}/${locale}${cleanPath}`;
}

export function buildAlternateUrls(path: string): Record<string, string> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return {
    'nb-NO': `${SEO_CONFIG.domains.no}/no/${cleanPath}`,
    'en': `${SEO_CONFIG.domains.en}/en/${cleanPath}`,
    'x-default': `${SEO_CONFIG.domains.no}/no/${cleanPath}`,
  };
}
