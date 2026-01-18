// Define Locale locally to avoid importing from @/types in Edge runtime
type Locale = 'no' | 'en';

const DEV_DOMAINS = ['localhost', 'vercel.app'];

function isDevDomain(hostname: string): boolean {
  return DEV_DOMAINS.some((dev) => hostname.includes(dev));
}

function getPrimaryDomainUrl(locale: Locale): string {
  return locale === 'en' ? 'https://dottyartwork.com' : 'https://dotty.no';
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
