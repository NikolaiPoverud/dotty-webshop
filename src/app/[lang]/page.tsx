import type { Metadata } from 'next';
import type { Locale } from '@/types';

import { Hero } from '@/components/landing/hero';
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export const revalidate = 60;

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

  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd lang={locale} />
      <Hero />
    </>
  );
}
