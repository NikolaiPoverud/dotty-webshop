import type { Locale, ProductListItem, CollectionCard } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

interface CollectionJsonLdProps {
  collection: CollectionCard;
  products: ProductListItem[];
  lang: Locale;
}

export function CollectionJsonLd({ collection, products, lang }: CollectionJsonLdProps) {
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
            availability: product.is_available && product.stock_quantity !== 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
