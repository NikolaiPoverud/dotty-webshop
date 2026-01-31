import type { Metadata } from 'next';
import type { Locale, ProductListItem, CollectionCard } from '@/types';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { locales, getDictionary } from '@/lib/i18n/get-dictionary';
import { createPublicClient } from '@/lib/supabase/public';
import { BreadcrumbJsonLd } from '@/components/seo';
import { ShopContent } from '@/components/shop/shop-content';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

const PRODUCT_LIST_COLUMNS =
  'id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry, year, shipping_size, sizes';

const METADATA_CONTENT = {
  no: {
    title: 'Kjøp Pop-Art | Originaler & Kunsttrykk',
    description:
      'Utforsk vår samling av pop-art. Originale malerier og limiterte trykk. Hvert kunstverk er unikt og bringer personlighet til ditt hjem.',
    locale: 'nb_NO',
    homeName: 'Hjem',
  },
  en: {
    title: 'Buy Pop-Art | Originals & Art Prints',
    description:
      'Explore our collection of pop-art. Original paintings and limited prints. Each artwork is unique and brings personality to your home.',
    locale: 'en_US',
    homeName: 'Home',
  },
} as const;

export const revalidate = 60;

type Props = {
  params: Promise<{ lang: string }>;
};

export function generateStaticParams(): Array<{ lang: Locale }> {
  return locales.map((lang) => ({ lang }));
}

async function getProducts(): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .is('deleted_at', null)
    .eq('is_public', true)
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
    .eq('is_public', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }

  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const content = METADATA_CONTENT[locale];
  const url = `${BASE_URL}/${locale}/shop`;
  const ogImage = `${BASE_URL}/og-image.jpg`;

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'website',
      locale: content.locale,
      url,
      siteName: 'Dotty.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Dotty. Pop-Art Shop' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
      languages: {
        'nb-NO': `${BASE_URL}/no/shop`,
        en: `${BASE_URL}/en/shop`,
      },
    },
  };
}

export default async function ShopPage({ params }: Props): Promise<React.JSX.Element> {
  const { lang } = await params;
  const locale = lang as Locale;
  const content = METADATA_CONTENT[locale];

  const [products, collections, dictionary] = await Promise.all([
    getProducts(),
    getCollections(),
    getDictionary(locale),
  ]);

  const breadcrumbItems = [
    { name: content.homeName, url: `/${locale}` },
    { name: 'Shop', url: `/${locale}/shop` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}`}
            className="group mb-6 inline-flex items-center gap-2 sm:gap-3"
          >
            <span className="flex h-8 w-8 items-center justify-center border border-muted-foreground/30 bg-background shadow-[1px_1px_0_0_theme(colors.border)] transition-all duration-200 group-hover:border-primary group-hover:text-primary group-hover:shadow-[2px_2px_0_0_theme(colors.primary)] sm:h-10 sm:w-10 sm:border-2 sm:shadow-[2px_2px_0_0_theme(colors.border)] sm:group-hover:shadow-[3px_3px_0_0_theme(colors.primary)]">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary sm:text-sm">
              {dictionary.shop.backToHome}
            </span>
          </Link>

          <h1 className="mb-8 text-center text-4xl font-bold sm:text-5xl">
            <span className="gradient-text">{dictionary.shop.title}</span>
          </h1>

          <ShopContent
            products={products}
            collections={collections}
            lang={locale}
            dictionary={dictionary}
          />
        </div>
      </div>
    </>
  );
}
