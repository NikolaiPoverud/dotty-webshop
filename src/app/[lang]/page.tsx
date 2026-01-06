import type { Metadata } from 'next';
import type { Locale, ProductListItem, CollectionCard, TestimonialCard } from '@/types';
import { Hero } from '@/components/landing/hero';
import { FeaturedGrid } from '@/components/landing/featured-grid';
import { ArtistStatement } from '@/components/landing/artist-statement';
import { Testimonials } from '@/components/landing/testimonials';
import { ContactSection } from '@/components/landing/contact-section';
import { createClient } from '@/lib/supabase/server';
import { OrganizationJsonLd } from '@/components/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Revalidate every 60 seconds for fresh data with caching benefits
export const revalidate = 60;

type Props = {
  params: Promise<{ lang: string }>;
};

async function getFeaturedProducts(): Promise<ProductListItem[]> {
  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, price, image_url, product_type, is_available, is_featured, stock_quantity, collection_id, requires_inquiry')
      .is('deleted_at', null)
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

async function getTestimonials(): Promise<TestimonialCard[]> {
  try {
    const supabase = await createClient();

    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select('id, name, feedback, source')
      .eq('is_active', true)
      .is('deleted_at', null)  // Exclude soft-deleted
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch testimonials:', error);
      return [];
    }

    return testimonials || [];
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
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

  const [products, collections, testimonials] = await Promise.all([
    getFeaturedProducts(),
    getCollections(),
    getTestimonials(),
  ]);

  return (
    <>
      <OrganizationJsonLd />
      <Hero lang={locale} />
      <FeaturedGrid lang={locale} products={products} collections={collections} />
      <ArtistStatement lang={locale} />
      <Testimonials testimonials={testimonials} />
      <ContactSection lang={locale} />
    </>
  );
}
