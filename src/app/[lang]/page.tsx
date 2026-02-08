import type { Metadata } from 'next';
import type { Locale, ProductListItem, CollectionCard, TestimonialCard } from '@/types';

import { ArtistStatement } from '@/components/landing/artist-statement';
import { ContactSection } from '@/components/landing/contact-section';
import { FeaturedGrid } from '@/components/landing/featured-grid';
import { Hero } from '@/components/landing/hero';
import { Testimonials } from '@/components/landing/testimonials';
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { createPublicClient } from '@/lib/supabase/public';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

const PRODUCT_LIST_COLUMNS =
  'id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry, year, shipping_size, sizes';

export const revalidate = 60;

async function getFeaturedProducts(): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .is('deleted_at', null)
    .eq('is_public', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(12);

  if (error) {
    console.error('Failed to fetch featured products:', error);
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

async function getTestimonials(): Promise<TestimonialCard[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, name, feedback, source')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch testimonials:', error);
    return [];
  }

  return data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isNorwegian = lang === 'no';

  const title = isNorwegian
    ? 'Dotty. | Kjøp Pop-Art Veggkunst fra Norsk Kunstner'
    : 'Dotty. | Buy Pop-Art Wall Art from Norwegian Artist';

  const description = isNorwegian
    ? 'Kjøp unik pop-art veggkunst med personlighet. Håndmalte originaler og signerte limited edition kunsttrykk fra norsk kunstner i Oslo. Perfekt kunstgave og interiørkunst.'
    : 'Buy unique pop-art wall art with personality. Hand-painted originals and signed limited edition art prints from Norwegian artist in Oslo. Perfect art gift and interior art.';

  const keywords = isNorwegian
    ? ['pop-art', 'kjøp kunst', 'veggkunst', 'norsk kunstner', 'kunsttrykk', 'originale kunstverk', 'kunstgave', 'interiørkunst', 'signert kunst', 'limited edition', 'håndmalt kunst', 'moderne kunst', 'skandinavisk kunst', 'oslo']
    : ['pop-art', 'buy art', 'wall art', 'norwegian artist', 'art prints', 'original artwork', 'art gift', 'interior art', 'signed art', 'limited edition', 'hand-painted art', 'modern art', 'scandinavian art', 'oslo'];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url: `${BASE_URL}/${lang}`,
      siteName: 'Dotty.',
      images: [{
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: isNorwegian ? 'Dotty. – Pop-Art Veggkunst fra Norsk Kunstner' : 'Dotty. – Pop-Art Wall Art from Norwegian Artist',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og-image.jpg`],
    },
    alternates: {
      canonical: `${BASE_URL}/${lang}`,
      languages: {
        'nb-NO': `${BASE_URL}/no`,
        'en': `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/no`,
      },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<React.ReactElement> {
  const { lang } = await params;
  const locale = lang as Locale;

  const [products, collections, testimonials, dictionary] = await Promise.all([
    getFeaturedProducts(),
    getCollections(),
    getTestimonials(),
    getDictionary(locale),
  ]);

  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd lang={locale} />
      <Hero />
      <FeaturedGrid
        lang={locale}
        products={products}
        collections={collections}
        dictionary={dictionary}
        showFilters={collections.length > 0}
      />
      <ArtistStatement lang={locale} />
      <Testimonials testimonials={testimonials} />
      <ContactSection lang={locale} dictionary={dictionary} />
    </>
  );
}
