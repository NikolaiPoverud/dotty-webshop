import type { Locale } from '@/types';

// Dictionary imports
const dictionaries = {
  no: () => import('./dictionaries/no.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};

export const locales: Locale[] = ['no', 'en'];
export const defaultLocale: Locale = 'no';

// Route mapping per language
export const routes = {
  no: {
    shop: 'shop',
    cart: 'handlekurv',
    checkout: 'kasse',
    sold: 'solgt',
    success: 'bekreftelse',
  },
  en: {
    shop: 'shop',
    cart: 'cart',
    checkout: 'checkout',
    sold: 'sold',
    success: 'success',
  },
} as const;

export type RouteKey = keyof typeof routes.no;

// Helper to get localized path
export function getLocalizedPath(locale: Locale, routeKey: RouteKey, slug?: string) {
  const route = routes[locale][routeKey];

  // Handle success as nested under checkout
  if (routeKey === 'success') {
    const checkoutRoute = routes[locale]['checkout'];
    return `/${locale}/${checkoutRoute}/${route}`;
  }

  const basePath = `/${locale}/${route}`;
  return slug ? `${basePath}/${slug}` : basePath;
}

// Helper to get the opposite locale
export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'no' ? 'en' : 'no';
}
