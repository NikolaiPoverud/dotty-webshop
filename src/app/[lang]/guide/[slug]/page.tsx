import type { Metadata } from 'next';
import type { Locale } from '@/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { locales } from '@/lib/i18n/get-dictionary';
import { GUIDES, getGuideBySlug } from '@/lib/content/guides';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export const revalidate = 86400;

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateStaticParams(): Promise<Array<{ lang: string; slug: string }>> {
  return locales.flatMap((lang) =>
    GUIDES.map((guide) => ({ lang, slug: guide.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: 'Not Found' };

  const locale = lang as Locale;
  const content = guide.content[locale];
  const isNorwegian = locale === 'no';

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      type: 'article',
      locale: isNorwegian ? 'nb_NO' : 'en_US',
      url: `${BASE_URL}/${locale}/guide/${slug}`,
      siteName: 'Dotty.',
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: content.title }],
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
    },
    twitter: { card: 'summary_large_image', title: content.metaTitle, description: content.metaDescription },
    alternates: {
      canonical: `${BASE_URL}/${locale}/guide/${slug}`,
      languages: {
        'nb-NO': `${BASE_URL}/no/guide/${slug}`,
        en: `${BASE_URL}/en/guide/${slug}`,
      },
    },
  };
}

function FAQAccordion({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <div className="space-y-0 divide-y divide-border">
      {faqs.map((faq) => (
        <details key={faq.question} className="group">
          <summary className="flex items-center justify-between cursor-pointer py-5 text-left hover:text-primary transition-colors">
            <span className="font-medium pr-4">{faq.question}</span>
            <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-muted-foreground leading-relaxed">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export default async function GuidePage({ params }: Props) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const guide = getGuideBySlug(slug);

  if (!guide) notFound();

  const content = guide.content[locale];
  const isNorwegian = locale === 'no';

  const relatedGuides = guide.relatedSlugs
    .map((s) => getGuideBySlug(s))
    .filter((g): g is NonNullable<typeof g> => g != null);

  const breadcrumbItems = [
    { name: isNorwegian ? 'Hjem' : 'Home', url: `/${locale}` },
    { name: isNorwegian ? 'Kunstguider' : 'Art Guides', url: `/${locale}/guide` },
    { name: content.title, url: `/${locale}/guide/${slug}` },
  ];

  return (
    <>
      <ArticleJsonLd
        title={content.title}
        description={content.metaDescription}
        slug={slug}
        lang={locale}
        sections={content.sections}
        faqs={content.faqs}
        datePublished={guide.datePublished}
        dateModified={guide.dateModified}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/guide`}
            className="group inline-flex items-center gap-2 sm:gap-3 mb-8"
          >
            <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background border sm:border-2 border-muted-foreground/30 group-hover:border-primary group-hover:text-primary transition-all duration-200 shadow-[1px_1px_0_0_theme(colors.border)] sm:shadow-[2px_2px_0_0_theme(colors.border)] group-hover:shadow-[2px_2px_0_0_theme(colors.primary)] sm:group-hover:shadow-[3px_3px_0_0_theme(colors.primary)]">
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
              {isNorwegian ? 'Alle guider' : 'All guides'}
            </span>
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="gradient-text">{content.title}</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            {content.excerpt}
          </p>

          <article className="space-y-10 mb-16">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold mb-3">{section.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              </section>
            ))}
          </article>

          {content.faqs.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6">
                {isNorwegian ? 'Vanlige sporsmal' : 'Frequently Asked Questions'}
              </h2>
              <FAQAccordion faqs={content.faqs} />
            </div>
          )}

          <div className="text-center bg-muted rounded-lg p-8 mb-12">
            <Link
              href={`/${locale}${content.cta.href}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
            >
              {content.cta.text}
            </Link>
          </div>

          {relatedGuides.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">
                {isNorwegian ? 'Les ogsa' : 'Also read'}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {relatedGuides.map((related) => {
                  const rc = related.content[locale];
                  return (
                    <Link
                      key={related.slug}
                      href={`/${locale}/guide/${related.slug}`}
                      className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <h4 className="font-medium group-hover:text-primary transition-colors mb-1">
                        {rc.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{rc.excerpt}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
