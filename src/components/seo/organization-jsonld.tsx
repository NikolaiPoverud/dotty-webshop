import type { ReactElement } from 'react';

import { BASE_URL, JsonLd } from './json-ld';

export function OrganizationJsonLd(): ReactElement {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dotty.',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Norsk pop-art kunstner fra Oslo. Kjøp håndmalte originale kunstverk og signerte limited edition kunsttrykk. Unik veggkunst og kunstgaver med personlighet.',
    foundingLocation: {
      '@type': 'Place',
      name: 'Oslo, Norway',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Oslo',
      addressCountry: 'NO',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Norwegian', 'English'],
    },
    knowsAbout: ['Pop Art', 'Contemporary Art', 'Modern Art', 'Wall Art', 'Art Prints', 'Art Posters', 'Original Artwork', 'Paintings', 'Scandinavian Art'],
  };

  return <JsonLd data={structuredData} />;
}
