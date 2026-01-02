import type { Metadata } from 'next';
import type { Locale, ProductListItem, CollectionCard } from '@/types';
import { ShopContent } from '@/components/shop/shop-content';
import { createClient } from '@/lib/supabase/server';
import { BreadcrumbJsonLd } from '@/components/seo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Disable caching to always fetch fresh data
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ collection?: string }>;
};

const pageText = {
  no: {
    title: 'Shop',
    backToHome: 'Tilbake',
  },
  en: {
    title: 'Shop',
    backToHome: 'Back',
  },
};

async function getProducts(): Promise<ProductListItem[]> {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry')
      .is('deleted_at', null)  // Exclude soft-deleted
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

async function getCollections(): Promise<CollectionCard[]> {
  try {
    const supabase = await createClient();

    const { data: collections, error } = await supabase
      .from('collections')
      .select('id, name, slug, description')
      .is('deleted_at', null)  // Exclude soft-deleted
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch collections:', error);
      return [];
    }

    return collections || [];
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const isNorwegian = lang === 'no';

  const title = isNorwegian
    ? 'Kjøp Pop-Art | Originaler & Kunsttrykk'
    : 'Buy Pop-Art | Originals & Art Prints';

  const description = isNorwegian
    ? 'Utforsk vår samling av pop-art. Originale malerier og limiterte trykk. Hvert kunstverk er unikt og bringer personlighet til ditt hjem.'
    : 'Explore our collection of pop-art. Original paintings and limited prints. Each artwork is unique and brings personality to your home.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url: `${BASE_URL}/${lang}/shop`,
      siteName: 'Dotty.',
      images: [{
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Dotty. Pop-Art Shop',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og-image.jpg`],
    },
    alternates: {
      canonical: `${BASE_URL}/${lang}/shop`,
      languages: {
        'nb-NO': `${BASE_URL}/no/shop`,
        'en': `${BASE_URL}/en/shop`,
      },
    },
  };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { collection: initialCollection } = await searchParams;
  const locale = lang as Locale;
  const t = pageText[locale];

  const [products, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: locale === 'no' ? 'Hjem' : 'Home', url: `/${locale}` },
    { name: 'Shop', url: `/${locale}/shop` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Landing */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToHome}
          </Link>

          {/* Page Title */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
            <span className="gradient-text">{t.title}</span>
          </h1>

          {/* Shop Content with Filters */}
          <ShopContent
            products={products}
            collections={collections}
            lang={locale}
            initialCollection={initialCollection}
          />
        </div>
      </div>
    </>
  );
}
