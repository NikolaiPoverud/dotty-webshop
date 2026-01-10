import type { MetadataRoute } from 'next';

const DOMAIN_NO = process.env.NEXT_PUBLIC_DOMAIN_NO || 'https://dotty.no';

const DISALLOWED_PATHS = [
  '/admin/',
  '/api/',
  '/checkout/',
  '/kasse/',
  '/handlekurv/',
  '/cart/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS }],
    sitemap: `${DOMAIN_NO}/sitemap.xml`,
  };
}
