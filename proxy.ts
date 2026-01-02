import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getLocaleForDomain } from '@/lib/domains';

const locales = ['no', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'no';

// Paths that should bypass locale handling
const publicPaths = [
  '/api',
  '/admin',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/og-image.jpg',
  '/logo.png',
  '/apple-touch-icon.png',
];

function getPathnameLocale(pathname: string): Locale | null {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Skip public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // Still update Supabase session for admin routes
    if (pathname.startsWith('/admin')) {
      return await updateSession(request);
    }
    return NextResponse.next();
  }

  // Get domain-specific locale (null for dev domains)
  const domainLocale = getLocaleForDomain(hostname);
  const pathnameLocale = getPathnameLocale(pathname);

  // If pathname already has a locale
  if (pathnameLocale) {
    // If domain forces a specific locale and pathname has different locale
    if (domainLocale && domainLocale !== pathnameLocale) {
      // Redirect to the same path but with correct locale
      const pathWithoutLocale = pathname.replace(`/${pathnameLocale}`, '');
      const url = request.nextUrl.clone();
      url.pathname = `/${domainLocale}${pathWithoutLocale || '/'}`;
      return NextResponse.redirect(url);
    }
    // Locale matches domain or no domain restriction, continue
    return NextResponse.next();
  }

  // No locale in pathname - add one
  const targetLocale = domainLocale || defaultLocale;
  const url = request.nextUrl.clone();

  // Handle root path
  if (pathname === '/') {
    url.pathname = `/${targetLocale}`;
    return NextResponse.redirect(url);
  }

  // Add locale prefix to path
  url.pathname = `/${targetLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
