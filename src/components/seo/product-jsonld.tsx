import type { Product } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

interface ProductJsonLdProps {
  product: Product;
  lang: 'no' | 'en';
}

export function ProductJsonLd({ product, lang }: ProductJsonLdProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `${product.product_type === 'original' ? 'Original' : 'Print'} pop-art by Dotty.`,
    image: product.image_url,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Dotty.',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Dotty.',
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/${lang}/shop/${product.slug}`,
      priceCurrency: 'NOK',
      price: (product.price / 100).toFixed(2),
      availability: product.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Dotty.',
      },
    },
    category: product.product_type === 'original' ? 'Original Artwork' : 'Art Print',
    material: product.product_type === 'original' ? 'Canvas' : 'Fine Art Paper',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
