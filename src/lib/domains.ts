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
 * Check if a hostname is a development domain
 */
function isDevDomain(hostname: string): boolean {
  return devDomains.some((dev) => hostname.includes(dev));
}

/**
 * Get the default locale for a domain (null for dev domains or unknown hosts)
 */
export function getLocaleForDomain(hostname: string): Locale | null {
  const match = domains.find((d) => d.domain === hostname);
  return match?.defaultLocale ?? null;
}

/**
 * Check if the current domain should force a specific locale
 */
export function shouldForceLocale(hostname: string, currentLocale: Locale): Locale | null {
  const domainLocale = getLocaleForDomain(hostname);
  return domainLocale && domainLocale !== currentLocale ? domainLocale : null;
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
  const pathWithoutLocale = currentPath.replace(/^\/(no|en)/, '') || '/';
  const isDev = !hostname || isDevDomain(hostname);

  if (isDev) {
    return `/${targetLocale}${pathWithoutLocale}`;
  }

  const targetDomain = getPrimaryDomainUrl(targetLocale);
  return `${targetDomain}/${targetLocale}${pathWithoutLocale}`;
}
