import type { Metadata } from 'next';
import type { Locale, Product, ProductListItem, CollectionCard, TestimonialCard } from '@/types';
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
const PRODUCT_LIST_COLUMNS = 'id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry, year, shipping_size, sizes';

export const revalidate = 60;

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

type CollectionInfo = {
  name: string | null;
  slug: string | null;
  shippingCost: number;
};

export async function generateStaticParams(): Promise<Array<{ lang: string; slug: string }>> {
  const supabase = createPublicClient();
  const [{ data: products }, { data: collections }] = await Promise.all([
    supabase.from('products').select('slug').is('deleted_at', null),
    supabase.from('collections').select('slug').is('deleted_at', null),
  ]);

  const slugs = [...(products ?? []).map((p) => p.slug), ...(collections ?? []).map((c) => c.slug)];
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

async function getCollection(slug: string): Promise<CollectionCard | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('collections')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single();

  return data ?? null;
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  return data ?? null;
}

async function getProductsForCollection(collectionId: string): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .eq('collection_id', collectionId)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  return data ?? [];
}

async function getAllCollections(): Promise<CollectionCard[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('collections')
    .select('id, name, slug, description')
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

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

async function getTestimonials(): Promise<TestimonialCard[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('testimonials')
    .select('id, name, feedback, source')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(5);
  return data ?? [];
}

async function getCollectionInfo(collectionId: string | null): Promise<CollectionInfo> {
  if (!collectionId) return { name: null, slug: null, shippingCost: 0 };

  const supabase = createPublicClient();
  const { data } = await supabase
    .from('collections')
    .select('name, slug, shipping_cost')
    .eq('id', collectionId)
    .single();

  return { name: data?.name ?? null, slug: data?.slug ?? null, shippingCost: data?.shipping_cost ?? 0 };
}

function buildAlternates(lang: string, slug: string): Metadata['alternates'] {
  return {
    canonical: `${BASE_URL}/${lang}/shop/${slug}`,
    languages: { 'nb-NO': `${BASE_URL}/no/shop/${slug}`, en: `${BASE_URL}/en/shop/${slug}` },
  };
}

function buildCollectionMetadata(collection: CollectionCard, lang: string, isNorwegian: boolean): Metadata {
  const title = isNorwegian ? `${collection.name} | Kjop Pop-Art` : `${collection.name} | Buy Pop-Art`;
  const description = collection.description ?? (isNorwegian
    ? `Utforsk var ${collection.name.toLowerCase()} samling. Unike pop-art verk fra Dotty.`
    : `Explore our ${collection.name.toLowerCase()} collection. Unique pop-art pieces from Dotty.`);
  const ogImage = `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url: `${BASE_URL}/${lang}/shop/${collection.slug}`,
      siteName: 'Dotty.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Dotty. ${collection.name}` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    alternates: buildAlternates(lang, collection.slug),
  };
}

function getProductTypeLabel(productType: Product['product_type'], isNorwegian: boolean): string {
  return productType === 'original'
    ? (isNorwegian ? 'Original kunstverk' : 'Original artwork')
    : (isNorwegian ? 'Kunsttrykk' : 'Art print');
}

function buildProductMetadata(product: Product, lang: string, isNorwegian: boolean): Metadata {
  const productTypeLabel = getProductTypeLabel(product.product_type, isNorwegian);
  const title = isNorwegian ? `${product.title} | Kjop ${productTypeLabel}` : `${product.title} | Buy ${productTypeLabel}`;
  const description = (isNorwegian
    ? `Kjøp ${product.title} - ${productTypeLabel} pop-art fra Dotty. ${product.description || ''} Fri frakt over 2000 kr.`
    : `Buy ${product.title} - ${productTypeLabel} pop-art from Dotty. ${product.description || ''} Free shipping over 2000 kr.`
  ).replace(/\s{2,}/g, ' ').trim();

  const images = product.image_url ? [{ url: product.image_url, width: 1200, height: 630, alt: product.title }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url: `${BASE_URL}/${lang}/shop/${product.slug}`,
      siteName: 'Dotty.',
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images: product.image_url ? [product.image_url] : [] },
    alternates: buildAlternates(lang, product.slug),
    other: {
      'product:price:amount': (product.price / 100).toFixed(0),
      'product:price:currency': 'NOK',
      'product:availability': product.is_available ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:brand': 'Dotty.',
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const isNorwegian = lang === 'no';

  const collection = await getCollection(slug);
  if (collection) return buildCollectionMetadata(collection, lang, isNorwegian);

  const product = await getProduct(slug);
  if (product) return buildProductMetadata(product, lang, isNorwegian);

  return { title: 'Not Found' };
}

function getHomeName(locale: Locale): string {
  return locale === 'no' ? 'Hjem' : 'Home';
}

export default async function ShopSlugPage({ params }: Props): Promise<React.JSX.Element> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const homeName = getHomeName(locale);

  const collection = await getCollection(slug);
  if (collection) {
    const [products, allCollections] = await Promise.all([getProductsForCollection(collection.id), getAllCollections()]);

    const breadcrumbItems = [
      { name: homeName, url: `/${locale}` },
      { name: 'Shop', url: `/${locale}/shop` },
      { name: collection.name, url: `/${locale}/shop/${slug}` },
    ];

    return (
      <>
        <BreadcrumbJsonLd items={breadcrumbItems} />
        <CollectionJsonLd collection={collection} products={products} lang={locale} />
        <div className="min-h-screen pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href={`/${locale}/shop`} className="group inline-flex items-center gap-2 sm:gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background border sm:border-2 border-muted-foreground/30 group-hover:border-primary group-hover:text-primary transition-all duration-200 shadow-[1px_1px_0_0_theme(colors.border)] sm:shadow-[2px_2px_0_0_theme(colors.border)] group-hover:shadow-[2px_2px_0_0_theme(colors.primary)] sm:group-hover:shadow-[3px_3px_0_0_theme(colors.primary)]">
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                {dictionary.shop.backToShop}
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
  if (!product) notFound();

  const [collectionInfo, relatedProducts, testimonials] = await Promise.all([
    getCollectionInfo(product.collection_id),
    getRelatedProducts(product.id, product.collection_id),
    getTestimonials(),
  ]);

  const breadcrumbItems = [
    { name: homeName, url: `/${locale}` },
    { name: 'Shop', url: `/${locale}/shop` },
  ];

  if (collectionInfo.name && collectionInfo.slug) {
    breadcrumbItems.push({ name: collectionInfo.name, url: `/${locale}/shop/${collectionInfo.slug}` });
  }
  breadcrumbItems.push({ name: product.title, url: `/${locale}/shop/${slug}` });

  return (
    <>
      <ProductJsonLd product={product} lang={locale} testimonials={testimonials} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductDetail
        product={product}
        collectionName={collectionInfo.name}
        collectionSlug={collectionInfo.slug}
        lang={locale}
        dictionary={dictionary}
      />
      {relatedProducts.length > 0 && <RelatedProducts products={relatedProducts} lang={locale} />}
    </>
  );
}
