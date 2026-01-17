import type { MetadataRoute } from 'next';

const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

const DISALLOWED_PATHS = [
  '/admin/',
  '/api/',
  '/checkout/',
  '/kasse/',
  '/handlekurv/',
  '/cart/',
];

/**
 * Robots.txt configuration
 *
 * Optimized for both traditional search engines and AI crawlers.
 * Explicitly allows AI/LLM crawlers for better AEO (Answer Engine Optimization).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // General crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Google
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Bing
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // OpenAI GPTBot
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Google Bard / Gemini
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Anthropic Claude
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Perplexity AI
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Common Crawl (used by many AI training)
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Cohere AI
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Meta AI
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Apple AI
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
    host: DOMAIN,
  };
}
