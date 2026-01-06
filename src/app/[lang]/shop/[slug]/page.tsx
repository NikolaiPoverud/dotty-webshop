import type { Metadata } from 'next';
import type { Locale, Product, ProductListItem, CollectionCard } from '@/types';
import { createPublicClient } from '@/lib/supabase/public';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductDetail } from '@/components/shop/product-detail';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import { CollectionJsonLd } from '@/components/seo/collection-jsonld';
import { ShopContent } from '@/components/shop/shop-content';
import { RelatedProducts } from '@/components/shop/related-products';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Revalidate every 60 seconds - balances freshness with caching
export const revalidate = 60;

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

// Check if slug is a collection slug
async function getCollection(slug: string): Promise<CollectionCard | null> {
  try {
    const supabase = createPublicClient();
    const { data: collection, error } = await supabase
      .from('collections')
      .select('id, name, slug, description')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();

    if (error || !collection) return null;
    return collection;
  } catch {
    return null;
  }
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = createPublicClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();

    if (error || !product) return null;
    return product;
  } catch {
    return null;
  }
}

async function getProductsForCollection(collectionId: string): Promise<ProductListItem[]> {
  try {
    const supabase = createPublicClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry')
      .eq('collection_id', collectionId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) return [];
    return products || [];
  } catch {
    return [];
  }
}

async function getAllCollections(): Promise<CollectionCard[]> {
  try {
    const supabase = createPublicClient();
    const { data: collections, error } = await supabase
      .from('collections')
      .select('id, name, slug, description')
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) return [];
    return collections || [];
  } catch {
    return [];
  }
}

async function getRelatedProducts(productId: string, collectionId: string | null, limit = 4): Promise<ProductListItem[]> {
  try {
    const supabase = createPublicClient();

    // First try to get products from the same collection
    if (collectionId) {
      const { data: sameCollection } = await supabase
        .from('products')
        .select('id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry')
        .eq('collection_id', collectionId)
        .neq('id', productId)
        .eq('is_available', true)
        .is('deleted_at', null)
        .limit(limit);

      if (sameCollection && sameCollection.length >= 2) {
        return sameCollection.slice(0, limit);
      }
    }

    // Fallback: get other available products
    const { data: otherProducts } = await supabase
      .from('products')
      .select('id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry')
      .neq('id', productId)
      .eq('is_available', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .limit(limit);

    return otherProducts || [];
  } catch {
    return [];
  }
}

interface CollectionInfo {
  name: string | null;
  slug: string | null;
  shippingCost: number;
}

async function getCollectionInfo(collectionId: string | null): Promise<CollectionInfo> {
  if (!collectionId) return { name: null, slug: null, shippingCost: 0 };

  try {
    const supabase = createPublicClient();
    const { data: collection } = await supabase
      .from('collections')
      .select('name, slug, shipping_cost')
      .eq('id', collectionId)
      .single();

    return {
      name: collection?.name || null,
      slug: collection?.slug || null,
      shippingCost: collection?.shipping_cost || 0,
    };
  } catch {
    return { name: null, slug: null, shippingCost: 0 };
  }
}

// Page text for collection view
const pageText = {
  no: {
    backToShop: 'Tilbake til shop',
    allProducts: 'Alle produkter',
  },
  en: {
    backToShop: 'Back to shop',
    allProducts: 'All products',
  },
};

// Generate metadata for SEO - handles both collections and products
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const isNorwegian = lang === 'no';

  // First check if it's a collection
  const collection = await getCollection(slug);

  if (collection) {
    // Collection metadata
    const title = isNorwegian
      ? `${collection.name} | Kjøp Pop-Art`
      : `${collection.name} | Buy Pop-Art`;

    const description = collection.description || (isNorwegian
      ? `Utforsk vår ${collection.name.toLowerCase()} samling. Unike pop-art verk fra Dotty.`
      : `Explore our ${collection.name.toLowerCase()} collection. Unique pop-art pieces from Dotty.`);

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
        images: [{
          url: `${BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `Dotty. ${collection.name}`,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${BASE_URL}/og-image.jpg`],
      },
      alternates: {
        canonical: `${BASE_URL}/${lang}/shop/${slug}`,
        languages: {
          'nb-NO': `${BASE_URL}/no/shop/${slug}`,
          'en': `${BASE_URL}/en/shop/${slug}`,
        },
      },
    };
  }

  // Product metadata
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Not Found' };
  }

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

export default async function ShopSlugPage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = lang as Locale;

  // First check if it's a collection
  const collection = await getCollection(slug);

  if (collection) {
    // Render collection view
    const t = pageText[locale];
    const [products, allCollections] = await Promise.all([
      getProductsForCollection(collection.id),
      getAllCollections(),
    ]);

    // Breadcrumb items for collection
    const breadcrumbItems = [
      { name: locale === 'no' ? 'Hjem' : 'Home', url: `/${locale}` },
      { name: 'Shop', url: `/${locale}/shop` },
      { name: collection.name, url: `/${locale}/shop/${slug}` },
    ];

    return (
      <>
        <BreadcrumbJsonLd items={breadcrumbItems} />
        <CollectionJsonLd
          collection={collection}
          products={products}
          lang={locale}
        />
        <div className="min-h-screen pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back to Shop */}
            <Link
              href={`/${locale}/shop`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backToShop}
            </Link>

            {/* Collection Title */}
            <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
              <span className="gradient-text">{collection.name}</span>
            </h1>

            {/* Shop Content - reuse the same component for consistent UX */}
            {/* Description is now handled inside ShopContent with smooth animations */}
            <ShopContent
              products={products}
              collections={allCollections}
              lang={locale}
              initialCollection={collection.id}
            />
          </div>
        </div>
      </>
    );
  }

  // Otherwise, render product detail
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const [collectionInfo, relatedProducts] = await Promise.all([
    getCollectionInfo(product.collection_id),
    getRelatedProducts(product.id, product.collection_id),
  ]);

  // Breadcrumb items including collection if available
  const breadcrumbItems = [
    { name: locale === 'no' ? 'Hjem' : 'Home', url: `/${locale}` },
    { name: 'Shop', url: `/${locale}/shop` },
    ...(collectionInfo.name && collectionInfo.slug
      ? [{ name: collectionInfo.name, url: `/${locale}/shop/${collectionInfo.slug}` }]
      : []),
    { name: product.title, url: `/${locale}/shop/${slug}` },
  ];

  return (
    <>
      <ProductJsonLd product={product} lang={locale} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductDetail
        product={product}
        collectionName={collectionInfo.name}
        collectionSlug={collectionInfo.slug}
        lang={locale}
      />
      {relatedProducts.length > 0 && (
        <RelatedProducts
          products={relatedProducts}
          lang={locale}
        />
      )}
    </>
  );
}
