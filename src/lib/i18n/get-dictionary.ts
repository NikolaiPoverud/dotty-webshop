import { cache } from 'react';
import type { Dictionary, Locale } from '@/types';

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  no: () => import('./dictionaries/no.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
};

export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
});

export const locales = Object.keys(dictionaries) as Locale[];
export const defaultLocale: Locale = 'no';

export const routes = {
  no: {
    shop: 'shop',
    cart: 'handlekurv',
    checkout: 'kasse',
    sold: 'solgt',
    success: 'bekreftelse',
    about: 'about',
  },
  en: {
    shop: 'shop',
    cart: 'cart',
    checkout: 'checkout',
    sold: 'sold',
    success: 'success',
    about: 'about',
  },
} as const;

export type RouteKey = keyof typeof routes.no;

export function getLocalizedPath(locale: Locale, routeKey: RouteKey, slug?: string): string {
  const route = routes[locale][routeKey];

  if (routeKey === 'success') {
    const checkoutRoute = routes[locale]['checkout'];
    return `/${locale}/${checkoutRoute}/${route}`;
  }

  const basePath = `/${locale}/${route}`;
  return slug ? `${basePath}/${slug}` : basePath;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'no' ? 'en' : 'no';
}
