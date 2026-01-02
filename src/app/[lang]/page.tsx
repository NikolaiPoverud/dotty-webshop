import type { Metadata } from 'next';
import type { Locale, Product, Collection } from '@/types';
import { Hero } from '@/components/landing/hero';
import { FeaturedGrid } from '@/components/landing/featured-grid';
import { ArtistStatement } from '@/components/landing/artist-statement';
import { ContactSection } from '@/components/landing/contact-section';
import { createClient } from '@/lib/supabase/server';
import { OrganizationJsonLd } from '@/components/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Disable caching to always fetch fresh data
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ lang: string }>;
};

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(12);

    if (error) {
      console.error('Failed to fetch featured products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return [];
  }
}

async function getCollections(): Promise<Collection[]> {
  try {
    const supabase = await createClient();

    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
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
    ? 'Dotty. | Pop-Art Kunst fra Norge - Originaler & Trykk'
    : 'Dotty. | Pop-Art from Norway - Originals & Prints';

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

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  const locale = lang as Locale;

  const [products, collections] = await Promise.all([
    getFeaturedProducts(),
    getCollections(),
  ]);

  return (
    <>
      <OrganizationJsonLd />
      <Hero lang={locale} />
      <FeaturedGrid lang={locale} products={products} collections={collections} />
      <ArtistStatement lang={locale} />
      <ContactSection lang={locale} />
    </>
  );
}
