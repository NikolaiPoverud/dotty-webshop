// Define Locale locally to avoid importing from @/types in Edge runtime
type Locale = 'no' | 'en';

export interface DomainConfig {
  domain: string;
  defaultLocale: Locale;
  isPrimary?: boolean;
}

// Domain configuration
// - dotty.no: Main domain (Norwegian)
// - dottyartwork.no: Secondary Norwegian domain
// - dottyartwork.com: English domain
export const domains: DomainConfig[] = [
  { domain: 'dotty.no', defaultLocale: 'no', isPrimary: true },
  { domain: 'www.dotty.no', defaultLocale: 'no' },
  { domain: 'dottyartwork.no', defaultLocale: 'no' },
  { domain: 'www.dottyartwork.no', defaultLocale: 'no' },
  { domain: 'dottyartwork.com', defaultLocale: 'en' },
  { domain: 'www.dottyartwork.com', defaultLocale: 'en' },
];

// Development/preview domains (allow any locale)
export const devDomains = [
  'localhost',
  'vercel.app',
];

/**
 * Get the default locale for a domain
 */
export function getLocaleForDomain(hostname: string): Locale | null {
  // Check for exact match first
  const exactMatch = domains.find(d => d.domain === hostname);
  if (exactMatch) {
    return exactMatch.defaultLocale;
  }

  // Check for development domains (return null to allow any locale)
  const isDev = devDomains.some(dev => hostname.includes(dev));
  if (isDev) {
    return null;
  }

  return null;
}

/**
 * Check if the current domain should force a specific locale
 */
export function shouldForceLocale(hostname: string, currentLocale: Locale): Locale | null {
  const domainLocale = getLocaleForDomain(hostname);

  // If domain has a specific locale and it differs from current, return the forced locale
  if (domainLocale && domainLocale !== currentLocale) {
    return domainLocale;
  }

  return null;
}

/**
 * Get the primary domain URL for a specific locale
 */
export function getPrimaryDomainUrl(locale: Locale): string {
  if (locale === 'en') {
    return 'https://dottyartwork.com';
  }
  return 'https://dotty.no';
}

/**
 * Get the canonical URL for a path (always uses primary domain)
 */
export function getCanonicalUrl(path: string, locale: Locale): string {
  const domain = getPrimaryDomainUrl(locale);
  return `${domain}${path}`;
}

/**
 * Get alternate URLs for hreflang tags
 */
export function getAlternateUrls(path: string): { locale: Locale; url: string }[] {
  return [
    { locale: 'no', url: `https://dotty.no${path}` },
    { locale: 'en', url: `https://dottyartwork.com${path}` },
  ];
}

/**
 * Get the language switch URL - switches to the alternate locale's domain
 * Returns full URL for production, relative path for dev
 */
export function getLanguageSwitchUrl(
  currentPath: string,
  currentLocale: Locale,
  hostname?: string
): string {
  const targetLocale: Locale = currentLocale === 'no' ? 'en' : 'no';

  // Check if we're on a dev domain (use relative paths)
  const isDev = !hostname || devDomains.some(dev => hostname.includes(dev));

  if (isDev) {
    // For development, just switch the locale prefix
    const pathWithoutLocale = currentPath.replace(/^\/(no|en)/, '');
    return `/${targetLocale}${pathWithoutLocale || '/'}`;
  }

  // For production, redirect to the appropriate domain
  const targetDomain = getPrimaryDomainUrl(targetLocale);
  const pathWithoutLocale = currentPath.replace(/^\/(no|en)/, '');

  return `${targetDomain}/${targetLocale}${pathWithoutLocale || '/'}`;
}
