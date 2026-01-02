import type { MetadataRoute } from 'next';

const DOMAIN_NO = process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
          '/kasse/',
          '/handlekurv/',
          '/cart/',
        ],
      },
    ],
    // Sitemap served from primary domain
    sitemap: `${DOMAIN_NO}/sitemap.xml`,
  };
}
