import type { Metadata } from 'next';
import type { Locale, Product, ProductListItem, CollectionCard } from '@/types';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { locales, getDictionary } from '@/lib/i18n/get-dictionary';
import { createPublicClient } from '@/lib/supabase/public';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import { CollectionJsonLd } from '@/components/seo/collection-jsonld';
import { ProductDetail } from '@/components/shop/product-detail';
import { RelatedProducts } from '@/components/shop/related-products';
import { ShopContent } from '@/components/shop/shop-content';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';
const PRODUCT_LIST_COLUMNS = 'id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry';

// Revalidate every 60 seconds - balances freshness with caching
export const revalidate = 60;

// Pre-render all product and collection pages at build time
export async function generateStaticParams() {
  const supabase = createPublicClient();

  const [{ data: products }, { data: collections }] = await Promise.all([
    supabase.from('products').select('slug').is('deleted_at', null),
    supabase.from('collections').select('slug').is('deleted_at', null),
  ]);

  const slugs = [
    ...(products || []).map(p => p.slug),
    ...(collections || []).map(c => c.slug),
  ];

  return locales.flatMap(lang => slugs.map(slug => ({ lang, slug })));
}

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

type CollectionInfo = {
  name: string | null;
  slug: string | null;
  shippingCost: number;
};

async function getCollection(slug: string): Promise<CollectionCard | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  return data;
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  return data;
}

async function getProductsForCollection(collectionId: string): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .eq('collection_id', collectionId)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) return [];
  return data ?? [];
}

async function getAllCollections(): Promise<CollectionCard[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, slug, description')
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) return [];
  return data ?? [];
}

async function getRelatedProducts(
  productId: string,
  collectionId: string | null,
  limit = 4
): Promise<ProductListItem[]> {
  const supabase = createPublicClient();

  if (collectionId) {
    const { data: sameCollection } = await supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS)
      .eq('collection_id', collectionId)
      .neq('id', productId)
      .eq('is_available', true)
      .eq('is_public', true)
      .is('deleted_at', null)
      .limit(limit);

    if (sameCollection && sameCollection.length >= 2) {
      return sameCollection.slice(0, limit);
    }
  }

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .neq('id', productId)
    .eq('is_available', true)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .limit(limit);

  return data ?? [];
}

async function getCollectionInfo(collectionId: string | null): Promise<CollectionInfo> {
  if (!collectionId) {
    return { name: null, slug: null, shippingCost: 0 };
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from('collections')
    .select('name, slug, shipping_cost')
    .eq('id', collectionId)
    .single();

  return {
    name: data?.name ?? null,
    slug: data?.slug ?? null,
    shippingCost: data?.shipping_cost ?? 0,
  };
}

function buildAlternates(lang: string, slug: string): Metadata['alternates'] {
  const url = `${BASE_URL}/${lang}/shop/${slug}`;
  return {
    canonical: url,
    languages: {
      'nb-NO': `${BASE_URL}/no/shop/${slug}`,
      'en': `${BASE_URL}/en/shop/${slug}`,
    },
  };
}

function buildCollectionMetadata(
  collection: CollectionCard,
  lang: string,
  isNorwegian: boolean
): Metadata {
  const collectionNameLower = collection.name.toLowerCase();
  const title = isNorwegian
    ? `${collection.name} | Kjop Pop-Art`
    : `${collection.name} | Buy Pop-Art`;

  let description = collection.description;
  if (!description) {
    description = isNorwegian
      ? `Utforsk var ${collectionNameLower} samling. Unike pop-art verk fra Dotty.`
      : `Explore our ${collectionNameLower} collection. Unique pop-art pieces from Dotty.`;
  }

  const url = `${BASE_URL}/${lang}/shop/${collection.slug}`;
  const ogImage = `${BASE_URL}/og-image.jpg`;
  const locale = isNorwegian ? 'nb_NO' : 'en_US';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale,
      url,
      siteName: 'Dotty.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Dotty. ${collection.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: buildAlternates(lang, collection.slug),
  };
}

function getProductTypeLabel(productType: Product['product_type'], isNorwegian: boolean): string {
  if (productType === 'original') {
    return isNorwegian ? 'Original kunstverk' : 'Original artwork';
  }
  return isNorwegian ? 'Kunsttrykk' : 'Art print';
}

function buildProductMetadata(
  product: Product,
  lang: string,
  isNorwegian: boolean
): Metadata {
  const productTypeLabel = getProductTypeLabel(product.product_type, isNorwegian);
  const title = isNorwegian
    ? `${product.title} | Kjop ${productTypeLabel}`
    : `${product.title} | Buy ${productTypeLabel}`;

  let description = product.description;
  if (!description) {
    description = isNorwegian
      ? `Kjop ${product.title} - unik pop-art fra Dotty. ${productTypeLabel} som bringer farge og energi til ditt hjem.`
      : `Buy ${product.title} - unique pop-art from Dotty. ${productTypeLabel} that brings color and energy to your home.`;
  }

  const url = `${BASE_URL}/${lang}/shop/${product.slug}`;
  const locale = isNorwegian ? 'nb_NO' : 'en_US';
  const images = product.image_url
    ? [{ url: product.image_url, width: 1200, height: 630, alt: product.title }]
    : [];
  const twitterImages = product.image_url ? [product.image_url] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale,
      url,
      siteName: 'Dotty.',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: twitterImages,
    },
    alternates: buildAlternates(lang, product.slug),
    other: {
      'product:price:amount': (product.price / 100).toFixed(0),
      'product:price:currency': 'NOK',
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const isNorwegian = lang === 'no';

  // Try collection first, then product
  const collection = await getCollection(slug);
  if (collection) {
    return buildCollectionMetadata(collection, lang, isNorwegian);
  }

  const product = await getProduct(slug);
  if (product) {
    return buildProductMetadata(product, lang, isNorwegian);
  }

  return { title: 'Not Found' };
}

function getHomeName(locale: Locale): string {
  return locale === 'no' ? 'Hjem' : 'Home';
}

export default async function ShopSlugPage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const t = dictionary.shop;

  const collection = await getCollection(slug);

  if (collection) {
    const [products, allCollections] = await Promise.all([
      getProductsForCollection(collection.id),
      getAllCollections(),
    ]);

    const breadcrumbItems = [
      { name: getHomeName(locale), url: `/${locale}` },
      { name: 'Shop', url: `/${locale}/shop` },
      { name: collection.name, url: `/${locale}/shop/${slug}` },
    ];

    return (
      <>
        <BreadcrumbJsonLd items={breadcrumbItems} />
        <CollectionJsonLd collection={collection} products={products} lang={locale} />
        <div className="min-h-screen pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href={`/${locale}/shop`}
              className="group inline-flex items-center gap-2 sm:gap-3 mb-6"
            >
              <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background border sm:border-2 border-muted-foreground/30 group-hover:border-primary group-hover:text-primary transition-all duration-200 shadow-[1px_1px_0_0_theme(colors.border)] sm:shadow-[2px_2px_0_0_theme(colors.border)] group-hover:shadow-[2px_2px_0_0_theme(colors.primary)] sm:group-hover:shadow-[3px_3px_0_0_theme(colors.primary)]">
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                {t.backToShop}
              </span>
            </Link>

            <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
              <span className="gradient-text">{collection.name}</span>
            </h1>

            <ShopContent
              products={products}
              collections={allCollections}
              lang={locale}
              dictionary={dictionary}
              initialCollection={collection.id}
            />
          </div>
        </div>
      </>
    );
  }

  const product = await getProduct(slug);
  if (!product) {
    notFound();
  }

  const [collectionInfo, relatedProducts] = await Promise.all([
    getCollectionInfo(product.collection_id),
    getRelatedProducts(product.id, product.collection_id),
  ]);

  const breadcrumbItems = [
    { name: getHomeName(locale), url: `/${locale}` },
    { name: 'Shop', url: `/${locale}/shop` },
  ];

  if (collectionInfo.name && collectionInfo.slug) {
    breadcrumbItems.push({
      name: collectionInfo.name,
      url: `/${locale}/shop/${collectionInfo.slug}`,
    });
  }

  breadcrumbItems.push({ name: product.title, url: `/${locale}/shop/${slug}` });

  return (
    <>
      <ProductJsonLd product={product} lang={locale} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductDetail
        product={product}
        collectionName={collectionInfo.name}
        collectionSlug={collectionInfo.slug}
        lang={locale}
        dictionary={dictionary}
      />
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} lang={locale} />
      )}
    </>
  );
}
