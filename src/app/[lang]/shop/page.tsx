import type { Metadata } from 'next';
import type { Locale, ProductListItem, CollectionCard } from '@/types';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { locales } from '@/lib/i18n/get-dictionary';
import { createPublicClient } from '@/lib/supabase/public';
import { BreadcrumbJsonLd } from '@/components/seo';
import { ShopContent } from '@/components/shop/shop-content';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Revalidate every 60 seconds for fresh product data with caching
export const revalidate = 60;

// Enable static generation for all locales
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type Props = {
  params: Promise<{ lang: string }>;
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

const PRODUCT_LIST_COLUMNS = 'id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry';

async function getProducts(): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
  return data ?? [];
}

async function getCollections(): Promise<CollectionCard[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, slug, description')
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const isNorwegian = lang === 'no';

  const title = isNorwegian
    ? 'Kjop Pop-Art | Originaler & Kunsttrykk'
    : 'Buy Pop-Art | Originals & Art Prints';

  const description = isNorwegian
    ? 'Utforsk var samling av pop-art. Originale malerier og limiterte trykk. Hvert kunstverk er unikt og bringer personlighet til ditt hjem.'
    : 'Explore our collection of pop-art. Original paintings and limited prints. Each artwork is unique and brings personality to your home.';

  const url = `${BASE_URL}/${lang}/shop`;
  const ogImage = `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url,
      siteName: 'Dotty.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Dotty. Pop-Art Shop' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
      languages: {
        'nb-NO': `${BASE_URL}/no/shop`,
        'en': `${BASE_URL}/en/shop`,
      },
    },
  };
}

export default async function ShopPage({ params }: Props) {
  const { lang } = await params;
  const locale = lang as Locale;
  const t = pageText[locale];

  const [products, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);

  const breadcrumbItems = [
    { name: locale === 'no' ? 'Hjem' : 'Home', url: `/${locale}` },
    { name: 'Shop', url: `/${locale}/shop` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}`}
            className="group inline-flex items-center gap-2 sm:gap-3 mb-6"
          >
            <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background border sm:border-2 border-muted-foreground/30 group-hover:border-primary group-hover:text-primary transition-all duration-200 shadow-[1px_1px_0_0_theme(colors.border)] sm:shadow-[2px_2px_0_0_theme(colors.border)] group-hover:shadow-[2px_2px_0_0_theme(colors.primary)] sm:group-hover:shadow-[3px_3px_0_0_theme(colors.primary)]">
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
              {t.backToHome}
            </span>
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
            <span className="gradient-text">{t.title}</span>
          </h1>

          <ShopContent
            products={products}
            collections={collections}
            lang={locale}
          />
        </div>
      </div>
    </>
  );
}
