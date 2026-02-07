import type { ReactElement } from 'react';

import type { Product, TestimonialCard } from '@/types';

import { BASE_URL, JsonLd } from './json-ld';

const BRAND = { '@type': 'Brand', name: 'Dotty.' } as const;
const ORGANIZATION = { '@type': 'Organization', name: 'Dotty.' } as const;
const COUNTRY_OF_ORIGIN = { '@type': 'Country', name: 'Norway' } as const;

const PRODUCT_TYPE_INFO = {
  original: {
    label: 'Original',
    category: 'Original Artwork',
    material: 'Canvas',
  },
  print: {
    label: 'Print',
    category: 'Art Print',
    material: 'Fine Art Paper',
  },
} as const;

interface ProductJsonLdProps {
  product: Product;
  lang: 'no' | 'en';
  testimonials?: TestimonialCard[];
}

function buildAdditionalProperties(product: Product): Record<string, unknown>[] | undefined {
  const firstSize = product.sizes?.[0];
  if (!firstSize) return undefined;

  return [
    {
      '@type': 'PropertyValue',
      name: 'width',
      value: firstSize.width,
      unitCode: 'CMT',
    },
    {
      '@type': 'PropertyValue',
      name: 'height',
      value: firstSize.height,
      unitCode: 'CMT',
    },
  ];
}

function buildOffers(product: Product, lang: string, availability: string): Record<string, unknown> {
  const url = `${BASE_URL}/${lang}/shop/${product.slug}`;
  const sizes = product.sizes;

  const pricesInOre = sizes
    ?.map((s) => s.price)
    .filter((p): p is number => p != null);

  if (pricesInOre && pricesInOre.length > 1) {
    const allPrices = [product.price, ...pricesInOre];
    const lowPrice = Math.min(...allPrices) / 100;
    const highPrice = Math.max(...allPrices) / 100;

    return {
      '@type': 'AggregateOffer',
      url,
      priceCurrency: 'NOK',
      lowPrice: lowPrice.toFixed(2),
      highPrice: highPrice.toFixed(2),
      offerCount: allPrices.length,
      availability,
    };
  }

  return {
    '@type': 'Offer',
    url,
    priceCurrency: 'NOK',
    price: (product.price / 100).toFixed(2),
    availability,
    itemCondition: 'https://schema.org/NewCondition',
    seller: ORGANIZATION,
  };
}

function buildReviewData(testimonials: TestimonialCard[]): {
  aggregateRating: Record<string, unknown>;
  review: Record<string, unknown>[];
} {
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      bestRating: '5',
      ratingCount: testimonials.length,
    },
    review: testimonials.map((t) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: t.name },
      reviewBody: t.feedback,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
    })),
  };
}

export function ProductJsonLd({ product, lang, testimonials }: ProductJsonLdProps): ReactElement {
  const typeInfo = PRODUCT_TYPE_INFO[product.product_type];
  const availability = product.is_available
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `${typeInfo.label} pop-art by Dotty.`,
    image: product.image_url,
    sku: product.id,
    brand: BRAND,
    manufacturer: ORGANIZATION,
    category: typeInfo.category,
    material: typeInfo.material,
    countryOfOrigin: COUNTRY_OF_ORIGIN,
    offers: buildOffers(product, lang, availability),
  };

  const additionalProperty = buildAdditionalProperties(product);
  if (additionalProperty) {
    structuredData.additionalProperty = additionalProperty;
  }

  if (product.year) {
    structuredData.productionDate = String(product.year);
  }

  if (testimonials && testimonials.length > 0) {
    const reviewData = buildReviewData(testimonials);
    structuredData.aggregateRating = reviewData.aggregateRating;
    structuredData.review = reviewData.review;
  }

  return <JsonLd data={structuredData} />;
}
