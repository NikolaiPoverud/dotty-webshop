import { NextResponse, type NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Redirect Vercel preview URLs to main domain
  if (hostname.includes('vercel.app') && !pathname.startsWith('/api')) {
    const url = new URL(`https://dotty.no${pathname}`);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  // Skip public paths entirely
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameLocale = getPathnameLocale(pathname);

  if (pathnameLocale) {
    // Already has locale, continue
    return NextResponse.next();
  }

  // No locale in pathname - redirect to add one
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Exclude api routes, static files, and other non-page routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
