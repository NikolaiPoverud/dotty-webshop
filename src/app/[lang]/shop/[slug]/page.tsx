import type { Metadata } from 'next';
import type { Locale, Product } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/shop/product-detail';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !product) {
      return null;
    }

    return product;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

async function getCollectionName(collectionId: string | null): Promise<string | null> {
  if (!collectionId) return null;

  try {
    const supabase = await createClient();

    const { data: collection } = await supabase
      .from('collections')
      .select('name')
      .eq('id', collectionId)
      .single();

    return collection?.name || null;
  } catch (error) {
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const isNorwegian = lang === 'no';
  const productTypeLabel = product.product_type === 'original'
    ? (isNorwegian ? 'Original kunstverk' : 'Original artwork')
    : (isNorwegian ? 'Kunsttrykk' : 'Art print');

  const title = isNorwegian
    ? `${product.title} | Kjøp ${productTypeLabel}`
    : `${product.title} | Buy ${productTypeLabel}`;

  const description = product.description || (isNorwegian
    ? `Kjøp ${product.title} - unik pop-art fra Dotty. ${productTypeLabel} som bringer farge og energi til ditt hjem.`
    : `Buy ${product.title} - unique pop-art from Dotty. ${productTypeLabel} that brings color and energy to your home.`);

  const price = (product.price / 100).toFixed(0);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url: `${BASE_URL}/${lang}/shop/${slug}`,
      siteName: 'Dotty.',
      images: product.image_url
        ? [{
            url: product.image_url,
            width: 1200,
            height: 630,
            alt: product.title,
          }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/${lang}/shop/${slug}`,
      languages: {
        'nb-NO': `${BASE_URL}/no/shop/${slug}`,
        'en': `${BASE_URL}/en/shop/${slug}`,
      },
    },
    other: {
      'product:price:amount': price,
      'product:price:currency': 'NOK',
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = lang as Locale;

  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const collectionName = await getCollectionName(product.collection_id);

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: locale === 'no' ? 'Hjem' : 'Home', url: `/${locale}` },
    { name: 'Shop', url: `/${locale}/shop` },
    { name: product.title, url: `/${locale}/shop/${slug}` },
  ];

  return (
    <>
      <ProductJsonLd product={product} lang={locale} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductDetail
        product={product}
        collectionName={collectionName}
        lang={locale}
      />
    </>
  );
}
