import type { Metadata } from 'next';
import type { Locale } from '@/types';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { locales } from '@/lib/i18n/get-dictionary';
import { GUIDES } from '@/lib/content/guides';
import { BreadcrumbJsonLd } from '@/components/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export const revalidate = 86400;

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams(): Promise<Array<{ lang: string }>> {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const isNorwegian = locale === 'no';

  const title = isNorwegian ? 'Kunstguider | Dotty.' : 'Art Guides | Dotty.';
  const description = isNorwegian
    ? 'Utforsk vare guider om pop-art, kunstpleie og tips for a velge kunst til hjemmet.'
    : 'Explore our guides about pop art, art care, and tips for choosing art for your home.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url: `${BASE_URL}/${locale}/guide`,
      siteName: 'Dotty.',
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Dotty. Art Guides' }],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `${BASE_URL}/${locale}/guide`,
      languages: {
        'nb-NO': `${BASE_URL}/no/guide`,
        en: `${BASE_URL}/en/guide`,
      },
    },
  };
}

export default async function GuideIndexPage({ params }: Props) {
  const { lang } = await params;
  const locale = lang as Locale;
  const isNorwegian = locale === 'no';

  const breadcrumbItems = [
    { name: isNorwegian ? 'Hjem' : 'Home', url: `/${locale}` },
    { name: isNorwegian ? 'Kunstguider' : 'Art Guides', url: `/${locale}/guide` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">
                {isNorwegian ? 'Kunstguider' : 'Art Guides'}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isNorwegian
                ? 'Lær mer om pop-art, hvordan du velger kunst til hjemmet, og hvordan du tar vare pa kunstverkene dine.'
                : 'Learn more about pop art, how to choose art for your home, and how to care for your artworks.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {GUIDES.map((guide) => {
              const content = guide.content[locale];
              return (
                <Link
                  key={guide.slug}
                  href={`/${locale}/guide/${guide.slug}`}
                  className="group p-6 border-2 border-border rounded-lg hover:border-primary transition-all duration-200 hover:shadow-[3px_3px_0_0_theme(colors.primary)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                >
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {content.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {content.excerpt}
                  </p>
                  <span className="inline-block mt-4 text-sm font-medium text-primary">
                    {isNorwegian ? 'Les mer' : 'Read more'} &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
