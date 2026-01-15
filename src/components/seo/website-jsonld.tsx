import type { ReactElement } from 'react';

import { BASE_URL, JsonLd } from './json-ld';

interface WebsiteJsonLdProps {
  lang: 'no' | 'en';
}

export function WebsiteJsonLd({ lang }: WebsiteJsonLdProps): ReactElement {
  const isNorwegian = lang === 'no';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Dotty.',
    alternateName: 'Dotty Art',
    url: BASE_URL,
    description: isNorwegian
      ? 'Pop-art med personlighet. Unike kunstverk fra Oslo-basert kunstner.'
      : 'Pop-art with personality. Unique artworks from Oslo-based artist.',
    inLanguage: isNorwegian ? 'nb-NO' : 'en',
    publisher: {
      '@type': 'Organization',
      name: 'Dotty.',
      url: BASE_URL,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/${lang}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={structuredData} />;
}
