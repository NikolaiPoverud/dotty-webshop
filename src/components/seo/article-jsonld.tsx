import type { ReactElement } from 'react';

import type { GuideSection, GuideFAQ } from '@/lib/content/guides';

import { BASE_URL, JsonLd } from './json-ld';

const ORGANIZATION = { '@type': 'Organization', name: 'Dotty.' } as const;

interface ArticleJsonLdProps {
  title: string;
  description: string;
  slug: string;
  lang: 'no' | 'en';
  sections?: GuideSection[];
  faqs?: GuideFAQ[];
  datePublished: string;
  dateModified: string;
}

export function ArticleJsonLd({
  title,
  description,
  slug,
  lang,
  faqs,
  datePublished,
  dateModified,
}: ArticleJsonLdProps): ReactElement {
  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: `${BASE_URL}/og-image.jpg`,
    author: ORGANIZATION,
    publisher: {
      '@type': 'Organization',
      name: 'Dotty.',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/og-image.jpg`,
      },
    },
    datePublished,
    dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/${lang}/guide/${slug}`,
    },
    inLanguage: lang === 'no' ? 'nb' : 'en',
  };

  if (!faqs || faqs.length === 0) {
    return <JsonLd data={articleData} />;
  }

  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={articleData} />
      <JsonLd data={faqData} />
    </>
  );
}
