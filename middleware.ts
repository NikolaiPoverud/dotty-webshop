import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const locales = ['no', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'no';

// Domain configuration - each domain maps to a specific locale
const DOMAINS = {
  // Norwegian domain (primary) → /no/
  NO: ['dotty.no', 'www.dotty.no'],
  // English domain (.com) → /en/
  EN: ['dottyartwork.com', 'www.dottyartwork.com'],
  // Redirect domains (redirect to dotty.no)
  REDIRECT: ['dottyartwork.no', 'www.dottyartwork.no'],
};

// Get locale based on hostname
function getLocaleForDomain(hostname: string): Locale | null {
  const host = hostname.split(':')[0]; // Remove port if present
  if (DOMAINS.NO.includes(host)) return 'no';
  if (DOMAINS.EN.includes(host)) return 'en';
  return null;
}

// Check if hostname should redirect to main domain
function shouldRedirectToMain(hostname: string): boolean {
  const host = hostname.split(':')[0];
  return DOMAINS.REDIRECT.includes(host);
}

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

// SEC-009 & SEC-012: Security headers for all responses
const isProduction = process.env.NODE_ENV === 'production';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // SEC-012: Enable HSTS in production
  ...(isProduction && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
  // SEC-015: Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://vitals.vercel-insights.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
};

function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
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
    return addSecurityHeaders(NextResponse.redirect(url, 308));
  }

  // Redirect dottyartworks.no to dotty.no (Norwegian main domain)
  if (shouldRedirectToMain(hostname)) {
    const url = new URL(`https://dotty.no${pathname}`);
    url.search = request.nextUrl.search;
    return addSecurityHeaders(NextResponse.redirect(url, 308));
  }

  // For admin routes, handle authentication
  if (pathname.startsWith('/admin')) {
    return handleAdminAuth(request);
  }

  // For API routes, skip locale handling but add security headers
  if (pathname.startsWith('/api')) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Skip other locale bypasses
  if (localeBypasses.some(path => pathname.startsWith(path))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Determine locale based on domain
  const domainLocale = getLocaleForDomain(hostname);
  const targetLocale = domainLocale || defaultLocale;

  // Handle i18n locale routing
  const pathnameLocale = getPathnameLocale(pathname);

  // If pathname has a locale, check if it matches the domain's locale
  if (pathnameLocale) {
    // If domain enforces a specific locale and pathname has different locale,
    // redirect to the correct locale for this domain
    if (domainLocale && pathnameLocale !== domainLocale) {
      const url = request.nextUrl.clone();
      // Replace the locale in the pathname
      const pathWithoutLocale = pathname.replace(`/${pathnameLocale}`, '') || '/';
      url.pathname = `/${domainLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
      return addSecurityHeaders(NextResponse.redirect(url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // No locale in pathname - redirect to add the appropriate one for this domain
  const url = request.nextUrl.clone();
  url.pathname = `/${targetLocale}${pathname === '/' ? '' : pathname}`;
  return addSecurityHeaders(NextResponse.redirect(url));
}

// Pages that don't require full authentication
const AUTH_BYPASS_PAGES = ['/admin/login', '/admin/reset-password'];
// Pages that require only aal1 (password auth, not MFA)
const MFA_BYPASS_PAGES = ['/admin/mfa-verify'];

// Handle admin authentication with Supabase session
async function handleAdminAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create request headers with x-pathname for the layout to read
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Skip auth check for login and reset-password pages
  if (AUTH_BYPASS_PAGES.includes(pathname)) {
    return addSecurityHeaders(NextResponse.next({
      request: { headers: requestHeaders },
    }));
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

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
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
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
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  // Check MFA status for protected pages (not MFA verify page itself)
  if (!MFA_BYPASS_PAGES.includes(pathname)) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    // If user has MFA enabled (nextLevel is aal2) but current session is only aal1,
    // redirect to MFA verification
    if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/mfa-verify';
      url.searchParams.set('redirect', pathname);
      return addSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Exclude api routes, static files, and other non-page routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
