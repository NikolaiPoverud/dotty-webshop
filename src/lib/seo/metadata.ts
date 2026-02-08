import type { Metadata } from 'next';
import type { Locale, Product, Collection } from '@/types';
import {
  SEO_CONFIG,
  SEO_TEMPLATES,
  PageType,
  getDomainForLocale,
  buildCanonicalUrl,
  buildAlternateUrls,
} from './config';

function interpolate(template: string, variables: Record<string, string | number>): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
}

function truncateDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

const PRODUCT_TYPE_LABELS: Record<'original' | 'print', { no: string; en: string }> = {
  original: { no: 'Originalt Kunstverk', en: 'Original Artwork' },
  print: { no: 'Kunsttrykk', en: 'Art Print' },
};

interface BaseMetadataOptions {
  locale: Locale;
  path: string;
  image?: string | null;
  noIndex?: boolean;
}

interface HomeMetadataOptions extends BaseMetadataOptions {
  pageType: 'home';
}

interface ShopMetadataOptions extends BaseMetadataOptions {
  pageType: 'shop';
}

interface ShopPaginatedMetadataOptions extends BaseMetadataOptions {
  pageType: 'shop-paginated';
  page: number;
  totalPages: number;
}

interface ProductMetadataOptions extends BaseMetadataOptions {
  pageType: 'product';
  product: Product;
}

interface CollectionMetadataOptions extends BaseMetadataOptions {
  pageType: 'collection';
  collection: Collection;
  productCount?: number;
}

interface CollectionPaginatedMetadataOptions extends BaseMetadataOptions {
  pageType: 'collection-paginated';
  collection: Collection;
  page: number;
  totalPages: number;
}

interface StaticPageMetadataOptions extends BaseMetadataOptions {
  pageType: 'sold' | 'about' | 'faq' | 'contact' | 'privacy' | 'terms';
}

interface FacetTypeMetadataOptions extends BaseMetadataOptions {
  pageType: 'facet-type';
  typeLabel: string;
  typeDescription: string;
  productCount: number;
}

interface FacetYearMetadataOptions extends BaseMetadataOptions {
  pageType: 'facet-year';
  year: number;
  productCount: number;
}

interface FacetPriceMetadataOptions extends BaseMetadataOptions {
  pageType: 'facet-price';
  rangeLabel: string;
  rangeDescription: string;
  productCount: number;
}

interface FacetSizeMetadataOptions extends BaseMetadataOptions {
  pageType: 'facet-size';
  sizeLabel: string;
  sizeDescription: string;
  productCount: number;
}

interface FacetTypeYearMetadataOptions extends BaseMetadataOptions {
  pageType: 'facet-type-year';
  typeLabel: string;
  year: number;
  productCount: number;
}

type MetadataOptions =
  | HomeMetadataOptions
  | ShopMetadataOptions
  | ShopPaginatedMetadataOptions
  | ProductMetadataOptions
  | CollectionMetadataOptions
  | CollectionPaginatedMetadataOptions
  | StaticPageMetadataOptions
  | FacetTypeMetadataOptions
  | FacetYearMetadataOptions
  | FacetPriceMetadataOptions
  | FacetSizeMetadataOptions
  | FacetTypeYearMetadataOptions;

export function generateMetadata(options: MetadataOptions): Metadata {
  const { locale, path, image, noIndex = false, pageType } = options;
  const template = SEO_TEMPLATES[pageType];
  const domain = getDomainForLocale(locale);
  const ogImage = image || `${domain}${SEO_CONFIG.defaultOgImage}`;

  // Build title and description based on page type
  let title: string;
  let description: string;
  let keywords: string[] = [];

  switch (options.pageType) {
    case 'home':
      title = template.titleTemplate[locale];
      description = template.descriptionTemplate[locale];
      keywords = locale === 'no'
        ? ['pop-art', 'kunst', 'kjøp kunst', 'norsk kunst', 'oslo', 'originale kunstverk', 'kunsttrykk', 'veggkunst', 'moderne kunst', 'kunstgave', 'signert kunst', 'limited edition', 'håndmalt', 'interiørkunst', 'skandinavisk kunst']
        : ['pop-art', 'art', 'buy art online', 'norwegian art', 'oslo', 'original artwork', 'art prints', 'wall art', 'modern art', 'art gift', 'signed art', 'limited edition', 'hand-painted', 'interior art', 'scandinavian art'];
      break;

    case 'shop':
      title = template.titleTemplate[locale];
      description = template.descriptionTemplate[locale];
      keywords = locale === 'no'
        ? ['kjøp kunst', 'pop-art butikk', 'kunsttrykk', 'originale malerier', 'veggkunst', 'kunstbutikk online', 'signert kunst', 'limited edition trykk', 'norsk kunstner', 'kunst til salgs']
        : ['buy art', 'pop-art shop', 'art prints', 'original paintings', 'wall art', 'online art shop', 'signed art', 'limited edition prints', 'norwegian artist', 'art for sale'];
      break;

    case 'shop-paginated': {
      const vars = { page: options.page };
      title = interpolate(template.titleTemplate[locale], vars);
      description = interpolate(template.descriptionTemplate[locale], vars);
      break;
    }

    case 'product': {
      const { product } = options;
      const typeLabel = PRODUCT_TYPE_LABELS[product.product_type][locale];
      const shortDesc = product.description
        ? truncateDescription(product.description, 80)
        : (locale === 'no' ? 'Unikt pop-art verk.' : 'Unique pop-art piece.');

      const vars = {
        title: product.title,
        type: typeLabel,
        description: shortDesc,
      };
      title = interpolate(template.titleTemplate[locale], vars);
      description = truncateDescription(interpolate(template.descriptionTemplate[locale], vars));

      // Product-specific keywords
      keywords = locale === 'no'
        ? [product.title, typeLabel.toLowerCase(), 'pop-art', 'dotty', 'kjøp kunst', 'norsk kunst', 'signert kunst', 'veggkunst',
           ...(product.product_type === 'original' ? ['håndmalt', 'originalt kunstverk', 'kunstinvestering'] : ['limited edition', 'kunsttrykk', 'kunstgave'])]
        : [product.title, typeLabel.toLowerCase(), 'pop-art', 'dotty', 'buy art', 'norwegian art', 'signed art', 'wall art',
           ...(product.product_type === 'original' ? ['hand-painted', 'original artwork', 'art investment'] : ['limited edition', 'art print', 'art gift'])];
      break;
    }

    case 'collection': {
      const { collection, productCount } = options;
      const collectionDesc = collection.description
        ? truncateDescription(collection.description, 80)
        : (locale === 'no'
          ? `${productCount || 'Flere'} unike pop-art verk.`
          : `${productCount || 'Multiple'} unique pop-art pieces.`);

      const vars = {
        name: collection.name,
        description: collectionDesc,
      };
      title = interpolate(template.titleTemplate[locale], vars);
      description = truncateDescription(interpolate(template.descriptionTemplate[locale], vars));

      keywords = locale === 'no'
        ? [collection.name, 'samling', 'pop-art', 'dotty', 'kjøp kunst', 'kuratert kunst', 'norsk kunstner', 'veggkunst']
        : [collection.name, 'collection', 'pop-art', 'dotty', 'buy art', 'curated art', 'norwegian artist', 'wall art'];
      break;
    }

    case 'collection-paginated': {
      const { collection, page } = options;
      const vars = { name: collection.name, page };
      title = interpolate(template.titleTemplate[locale], vars);
      description = interpolate(template.descriptionTemplate[locale], vars);
      break;
    }

    case 'facet-type': {
      const { typeLabel, typeDescription, productCount } = options;
      const vars = { type: typeLabel, description: typeDescription, count: productCount };
      title = interpolate(template.titleTemplate[locale], vars);
      description = truncateDescription(interpolate(template.descriptionTemplate[locale], vars));
      keywords = locale === 'no'
        ? [typeLabel.toLowerCase(), 'pop-art', 'kjøp kunst', 'norsk kunst', 'signert kunst', 'veggkunst', 'dotty']
        : [typeLabel.toLowerCase(), 'pop-art', 'buy art', 'norwegian art', 'signed art', 'wall art', 'dotty'];
      break;
    }

    case 'facet-year': {
      const { year, productCount } = options;
      const vars = { year, count: productCount };
      title = interpolate(template.titleTemplate[locale], vars);
      description = truncateDescription(interpolate(template.descriptionTemplate[locale], vars));
      keywords = locale === 'no'
        ? [`pop-art ${year}`, `kunstverk ${year}`, 'norsk kunstner', 'moderne kunst', 'dotty']
        : [`pop-art ${year}`, `artworks ${year}`, 'norwegian artist', 'modern art', 'dotty'];
      break;
    }

    case 'facet-price': {
      const { rangeLabel, rangeDescription, productCount } = options;
      const vars = { range: rangeLabel, description: rangeDescription, count: productCount };
      title = interpolate(template.titleTemplate[locale], vars);
      description = truncateDescription(interpolate(template.descriptionTemplate[locale], vars));
      keywords = locale === 'no'
        ? ['kjøp kunst', 'pop-art pris', rangeLabel.toLowerCase(), 'kunstgave', 'kunstinvestering', 'dotty']
        : ['buy art', 'pop-art price', rangeLabel.toLowerCase(), 'art gift', 'art investment', 'dotty'];
      break;
    }

    case 'facet-size': {
      const { sizeLabel, sizeDescription, productCount } = options;
      const vars = { size: sizeLabel, description: sizeDescription, count: productCount };
      title = interpolate(template.titleTemplate[locale], vars);
      description = truncateDescription(interpolate(template.descriptionTemplate[locale], vars));
      keywords = locale === 'no'
        ? [sizeLabel.toLowerCase(), 'veggkunst', 'pop-art størrelse', 'interiørkunst', 'kunst til hjemmet', 'dotty']
        : [sizeLabel.toLowerCase(), 'wall art', 'pop-art size', 'interior art', 'art for home', 'dotty'];
      break;
    }

    case 'facet-type-year': {
      const { typeLabel, year, productCount } = options;
      const vars = { type: typeLabel, year, count: productCount };
      title = interpolate(template.titleTemplate[locale], vars);
      description = truncateDescription(interpolate(template.descriptionTemplate[locale], vars));
      keywords = locale === 'no'
        ? [`${typeLabel.toLowerCase()} ${year}`, 'pop-art', 'norsk kunst', 'signert kunst', 'dotty']
        : [`${typeLabel.toLowerCase()} ${year}`, 'pop-art', 'norwegian art', 'signed art', 'dotty'];
      break;
    }

    default:
      title = template.titleTemplate[locale];
      description = template.descriptionTemplate[locale];
  }

  const canonical = buildCanonicalUrl(locale, path);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: noIndex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: {
      canonical,
      languages: buildAlternateUrls(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SEO_CONFIG.siteName,
      locale: locale === 'no' ? 'nb_NO' : 'en_US',
      type: 'website',
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      site: SEO_CONFIG.twitterHandle,
    },
  };
}

export function generatePaginationLinks(
  locale: Locale,
  basePath: string,
  currentPage: number,
  totalPages: number
): { prev?: string; next?: string } {
  const domain = getDomainForLocale(locale);
  const result: { prev?: string; next?: string } = {};

  if (currentPage > 1) {
    const prevPage = currentPage === 2 ? '' : `?page=${currentPage - 1}`;
    result.prev = `${domain}/${locale}${basePath}${prevPage}`;
  }

  if (currentPage < totalPages) {
    result.next = `${domain}/${locale}${basePath}?page=${currentPage + 1}`;
  }

  return result;
}

export function generateUniqueContent(
  baseContent: string,
  locale: Locale,
  context: {
    productName?: string;
    collectionName?: string;
    productType?: 'original' | 'print';
    price?: number;
  }
): string {
  const { productName, collectionName, productType, price } = context;

  // Add contextual variations
  const variations: string[] = [baseContent];

  if (productName) {
    variations.push(locale === 'no'
      ? `${productName} er et unikt stykke fra Dotty.`
      : `${productName} is a unique piece from Dotty.`
    );
  }

  if (collectionName) {
    variations.push(locale === 'no'
      ? `Del av ${collectionName} samlingen.`
      : `Part of the ${collectionName} collection.`
    );
  }

  if (productType) {
    const typeDesc = productType === 'original'
      ? (locale === 'no' ? 'Håndmalt original.' : 'Hand-painted original.')
      : (locale === 'no' ? 'Begrenset opplag trykk.' : 'Limited edition print.');
    variations.push(typeDesc);
  }

  if (price && price > 0) {
    const formattedPrice = new Intl.NumberFormat(locale === 'no' ? 'nb-NO' : 'en-US', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(price / 100);

    variations.push(locale === 'no'
      ? `Tilgjengelig for ${formattedPrice}.`
      : `Available for ${formattedPrice}.`
    );
  }

  return variations.join(' ');
}
