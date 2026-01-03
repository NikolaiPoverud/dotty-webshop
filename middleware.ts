import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const locales = ['no', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'no';

// Paths that bypass locale handling
const localeBypasses = [
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

// Paths that bypass all middleware processing
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
];

function getPathnameLocale(pathname: string): Locale | null {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

// ARCH-003: Consolidated middleware - handles i18n, auth, and session management
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Skip static assets entirely
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Redirect Vercel preview URLs to main domain
  if (hostname.includes('vercel.app') && !pathname.startsWith('/api')) {
    const url = new URL(`https://dotty.no${pathname}`);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  // For admin routes, handle authentication
  if (pathname.startsWith('/admin')) {
    return handleAdminAuth(request);
  }

  // For API routes, skip locale handling
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip other locale bypasses
  if (localeBypasses.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Handle i18n locale routing
  const pathnameLocale = getPathnameLocale(pathname);
  if (pathnameLocale) {
    return NextResponse.next();
  }

  // No locale in pathname - redirect to add one
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

// Handle admin authentication with Supabase session
async function handleAdminAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for login and reset-password pages
  if (pathname === '/admin/login' || pathname === '/admin/reset-password') {
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  let response = NextResponse.next({ request });
  response.headers.set('x-pathname', pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Exclude api routes, static files, and other non-page routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
