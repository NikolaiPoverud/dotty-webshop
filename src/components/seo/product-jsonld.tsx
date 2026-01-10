import type { ReactElement } from 'react';

import type { Product } from '@/types';

import { BASE_URL, JsonLd } from './json-ld';

const BRAND = { '@type': 'Brand', name: 'Dotty.' } as const;
const ORGANIZATION = { '@type': 'Organization', name: 'Dotty.' } as const;

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
}

export function ProductJsonLd({ product, lang }: ProductJsonLdProps): ReactElement {
  const typeInfo = PRODUCT_TYPE_INFO[product.product_type];
  const availability = product.is_available
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const structuredData = {
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
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/${lang}/shop/${product.slug}`,
      priceCurrency: 'NOK',
      price: (product.price / 100).toFixed(2),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: ORGANIZATION,
    },
  };

  return <JsonLd data={structuredData} />;
}
