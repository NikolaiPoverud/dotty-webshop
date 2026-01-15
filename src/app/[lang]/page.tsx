import type { Metadata } from 'next';
import type { Locale, ProductListItem, CollectionCard, TestimonialCard } from '@/types';
import { Hero } from '@/components/landing/hero';
import { FeaturedGrid } from '@/components/landing/featured-grid';
import { ArtistStatement } from '@/components/landing/artist-statement';
import { Testimonials } from '@/components/landing/testimonials';
import { ContactSection } from '@/components/landing/contact-section';
import { createPublicClient } from '@/lib/supabase/public';
import { OrganizationJsonLd } from '@/components/seo';
import { getDictionary } from '@/lib/i18n/get-dictionary';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Revalidate every 60 seconds for fresh data with caching benefits
export const revalidate = 60;

async function getFeaturedProducts(): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, title, slug, price, image_url, product_type, is_available, is_featured, is_public, stock_quantity, collection_id, requires_inquiry')
    .is('deleted_at', null)
    .eq('is_public', true)
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
    ? 'Dotty. | Pop-Art fra Norge – Originaler & Trykk'
    : 'Dotty. | Pop-Art from Norway – Originals & Prints';

  const description = isNorwegian
    ? 'Oppdag unik pop-art med personlighet. Kjøp originale kunstverk og limiterte trykk som bringer energi og farge til ditt hjem. Gratis frakt i Norge.'
    : 'Discover unique pop-art with personality. Buy original artworks and limited prints that bring energy and color to your home. Free shipping in Norway.';

  return {
    title,
    description,
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
        alt: 'Dotty. Pop-Art',
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
      <Hero dictionary={dictionary} />
      <FeaturedGrid lang={locale} products={products} collections={collections} dictionary={dictionary} />
      <ArtistStatement lang={locale} />
      <Testimonials testimonials={testimonials} />
      <ContactSection lang={locale} dictionary={dictionary} />
    </>
  );
}
