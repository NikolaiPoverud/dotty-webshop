import type { ReactElement } from 'react';

import { BASE_URL, JsonLd } from './json-ld';

export function OrganizationJsonLd(): ReactElement {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dotty.',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Pop-art med personlighet. Unike kunstverk som bringer energi og farge til ditt hjem.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NO',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Norwegian', 'English'],
    },
  };

  return <JsonLd data={structuredData} />;
}
