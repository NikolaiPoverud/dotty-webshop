/**
 * ItemList JSON-LD for Faceted Pages
 *
 * Generates Schema.org ItemList structured data for faceted pages
 * that don't have an associated collection.
 */

import type { ReactElement } from 'react';
import type { Locale, ProductListItem } from '@/types';
import { BASE_URL, JsonLd } from './json-ld';

interface ItemListJsonLdProps {
  name: string;
  description: string;
  products: ProductListItem[];
  lang: Locale;
  url?: string;
}

function getAvailability(product: ProductListItem): string {
  const inStock = product.is_available && product.stock_quantity !== 0;
  return inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
}

export function ItemListJsonLd({
  name,
  description,
  products,
  lang,
  url,
}: ItemListJsonLdProps): ReactElement {
  const pageUrl = url || `${BASE_URL}/${lang}/shop`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      name,
      description,
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.title,
          url: `${BASE_URL}/${lang}/shop/${product.slug}`,
          image: product.image_url,
          offers: {
            '@type': 'Offer',
            price: (product.price / 100).toFixed(2),
            priceCurrency: 'NOK',
            availability: getAvailability(product),
          },
        },
      })),
    },
  };

  return <JsonLd data={structuredData} />;
}
