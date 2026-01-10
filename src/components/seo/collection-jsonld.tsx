import type { ReactElement } from 'react';

import type { CollectionCard, Locale, ProductListItem } from '@/types';

import { BASE_URL, JsonLd } from './json-ld';

interface CollectionJsonLdProps {
  collection: CollectionCard;
  products: ProductListItem[];
  lang: Locale;
}

function getAvailability(product: ProductListItem): string {
  const inStock = product.is_available && product.stock_quantity !== 0;
  return inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
}

export function CollectionJsonLd({ collection, products, lang }: CollectionJsonLdProps): ReactElement {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: `${BASE_URL}/${lang}/shop/${collection.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      name: collection.name,
      description: collection.description,
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
