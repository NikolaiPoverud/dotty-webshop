const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export function OrganizationJsonLd() {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
