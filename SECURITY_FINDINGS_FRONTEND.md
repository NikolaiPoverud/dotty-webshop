# Frontend & Client-Side Security Audit Findings

**Project**: Dotty. Pop-Art Webshop
**Date**: 2026-02-10
**Scope**: Frontend code, client-side security, environment variables, authentication, dependencies
**Auditor**: Automated security review (Claude)

---

## Executive Summary

The codebase demonstrates a generally strong security posture for an e-commerce application. Many common vulnerabilities have been proactively addressed, including CSP headers, rate limiting, server-side cart validation, DOMPurify sanitization, CSRF checkout tokens, and MFA support. However, several findings warrant attention, ranging from low-severity informational items to medium-severity issues that should be resolved.

**Critical**: 0
**High**: 1
**Medium**: 5
**Low**: 6
**Informational**: 5

---

## HIGH Severity

### H-1: Open Redirect via MFA Verification Page

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/admin/mfa-verify/page.tsx` (line 24)

**Description**: The MFA verification page reads a `redirect` query parameter from the URL and uses it directly for `router.push()` after MFA verification succeeds. There is no validation that the redirect target is an internal/safe path.

```typescript
const redirectTo = searchParams.get('redirect') || '/admin/dashboard';
// ...
router.push(redirectTo);
```

An attacker could craft a URL like `/admin/mfa-verify?redirect=https://evil.com` and send it to an admin. After the admin enters their MFA code, they would be redirected to the attacker-controlled site, potentially for credential phishing.

**Impact**: An authenticated admin could be redirected to a malicious external URL after completing MFA verification.

**Recommended Fix**: Validate that the redirect parameter starts with `/admin/` and does not contain protocol prefixes:

```typescript
function getSafeRedirect(param: string | null): string {
  const fallback = '/admin/dashboard';
  if (!param) return fallback;
  // Must start with /admin/ and not contain protocol
  if (param.startsWith('/admin/') && !param.includes('://') && !param.startsWith('//')) {
    return param;
  }
  return fallback;
}
const redirectTo = getSafeRedirect(searchParams.get('redirect'));
```

---

## MEDIUM Severity

### M-1: Unvalidated Redirect URL from Checkout API Response

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/[lang]/kasse/page.tsx` (lines 230-232)

**Description**: The checkout page redirects users to a URL returned from the server API response without client-side validation:

```typescript
const redirectUrl = result.url ?? result.redirectUrl;
if (redirectUrl) {
  window.location.href = redirectUrl;
}
```

While the server should always return legitimate Stripe or Vipps URLs, if the API were compromised or a man-in-the-middle attack occurred, the user could be redirected to a malicious payment phishing page.

**Impact**: Users could be redirected to a phishing site during checkout if the API response is tampered with.

**Recommended Fix**: Validate the redirect URL against an allowlist of known payment provider domains:

```typescript
const ALLOWED_REDIRECT_HOSTS = ['checkout.stripe.com', 'api.vipps.no', 'apitest.vipps.no'];
const redirectUrl = result.url ?? result.redirectUrl;
if (redirectUrl) {
  try {
    const url = new URL(redirectUrl);
    if (ALLOWED_REDIRECT_HOSTS.some(host => url.hostname.endsWith(host))) {
      window.location.href = redirectUrl;
    } else {
      setError('Invalid payment redirect URL');
    }
  } catch {
    setError('Invalid payment redirect URL');
  }
}
```

### M-2: Newsletter Email Template Renders Unsanitized HTML

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/emails/newsletter.tsx` (line 37)

**Description**: The newsletter email template renders HTML content using `dangerouslySetInnerHTML` without sanitization:

```typescript
<div
  style={{ ... }}
  dangerouslySetInnerHTML={{ __html: content }}
/>
```

While the admin customers page properly uses DOMPurify to sanitize content before display in the browser (line 147-151 of `customers/page.tsx`), the email template itself does not sanitize. If the content stored in the email queue contains malicious HTML/JavaScript, it will be rendered in recipients' email clients. Most email clients strip scripts, but HTML injection (phishing links, image beacons) remains a risk.

**Impact**: An admin could unknowingly send newsletter emails with injected HTML if the content editor is compromised or if content is inserted via API.

**Recommended Fix**: Sanitize the HTML content server-side before passing it to the email template, or add DOMPurify sanitization within the email rendering pipeline.

### M-3: Content Security Policy Allows `unsafe-inline` and `unsafe-eval`

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/middleware.ts` (lines 134-147)

**Description**: The Content Security Policy includes `'unsafe-inline'` and `'unsafe-eval'` in the `script-src` directive:

```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ...
```

While `'unsafe-inline'` is commonly needed for Next.js (inline scripts for data hydration), `'unsafe-eval'` significantly weakens XSS protections by allowing `eval()` and `new Function()` execution. This undermines much of the protection CSP is designed to provide.

**Impact**: If an XSS vulnerability is found elsewhere, the `unsafe-eval` directive allows attackers to execute arbitrary JavaScript through `eval()`.

**Recommended Fix**:
1. Remove `'unsafe-eval'` from the CSP. If specific libraries require it, use nonce-based CSP instead.
2. Consider using `'nonce-{random}'` instead of `'unsafe-inline'` for scripts. Next.js supports CSP nonces via the `nonce` prop.
3. The `style-src 'unsafe-inline'` is generally acceptable for Tailwind CSS but could also be tightened with nonces if feasible.

### M-4: Gallery Upload Missing File Size Validation

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/components/admin/gallery-upload.tsx` (lines 71-113)

**Description**: The `GalleryUpload` component does not validate file size before uploading, unlike the `ImageUpload` component which enforces a 10MB limit:

```typescript
// ImageUpload has this check:
const MAX_FILE_SIZE = 10 * 1024 * 1024;
if (file.size > MAX_FILE_SIZE) { ... }

// GalleryUpload does NOT have this check
async function handleUpload(file: File): Promise<void> {
  if (!file || file.size === 0) { ... }  // Only checks for empty
  // No size check before upload
}
```

**Impact**: Large files could be uploaded through the gallery, consuming bandwidth and storage. While the server-side API likely has its own limits, client-side validation provides better UX and reduces unnecessary network traffic.

**Recommended Fix**: Add the same `MAX_FILE_SIZE` check that exists in `ImageUpload`:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024;
if (file.size > MAX_FILE_SIZE) {
  setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
  return;
}
```

### M-5: Gallery Upload Missing MIME Type Validation on Drop

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/components/admin/gallery-upload.tsx`

**Description**: The `GalleryUpload` component does not have drag-and-drop support with MIME type validation. The `ImageUpload` component checks `file.type.startsWith('image/')` on drop (line 85), but `GalleryUpload` only relies on the `accept` attribute of the file input. Since `GalleryUpload` does not handle drag-and-drop events, this is a low concern -- but note that the `accept` attribute of file inputs can be bypassed by users. Server-side validation is the true safeguard.

**Impact**: If drag-and-drop were added to gallery upload without MIME validation, non-image files could be uploaded.

**Recommended Fix**: Ensure server-side upload endpoint validates MIME types (which it likely does). If drag-and-drop is added to GalleryUpload, include MIME type checking.

---

## LOW Severity

### L-1: Missing `rel="noopener noreferrer"` on Admin Sidebar External Link

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/components/admin/admin-sidebar.tsx` (lines 154-161)

**Description**: The "Se shop" link in the admin sidebar uses `target="_blank"` without `rel="noopener noreferrer"`:

```tsx
<Link
  href="/no"
  target="_blank"
  className="..."
>
```

While this is an internal link (same origin) and modern browsers default to `noopener`, adding the attribute explicitly is a best practice. All other `target="_blank"` links in the codebase correctly include `rel="noopener noreferrer"`.

**Recommended Fix**: Add `rel="noopener noreferrer"` to the Link element.

### L-2: Cart Data Stored in localStorage Without Integrity Check

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/components/cart/cart-provider.tsx` (lines 171-194)

**Description**: Cart data is serialized to `localStorage` and deserialized on page load. While `JSON.parse` errors are caught, the deserialized data is loaded directly into the cart state without validation of its structure or values.

```typescript
const data = JSON.parse(stored);
// ...
dispatch({ type: 'LOAD_CART', payload: storedCart.cart });
```

A malicious browser extension or XSS attack could modify localStorage to inject unexpected cart data (e.g., negative prices). However, the server-side checkout validation (`checkout-validation.ts`) correctly ignores client-provided prices and uses database prices, which mitigates the most serious exploitation.

**Impact**: Low, since server-side validation is in place. Could cause UI display issues with corrupted data.

**Recommended Fix**: Add structural validation (e.g., with Zod) when loading cart from localStorage to ensure type safety.

### L-3: Cookie Consent Stored Only in localStorage

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/components/gdpr/cookie-consent.tsx` (lines 28-43)

**Description**: Cookie consent preference is saved to `localStorage` and then sent to the server via a fire-and-forget `fetch` call. If the server call fails (silently caught), the consent record only exists client-side, which may not satisfy GDPR requirements for demonstrable consent records.

```typescript
localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
setShowBanner(false);
fetch('/api/gdpr/cookie-consent', { ... }).catch(() => {
  // Silently fail - consent is already saved locally
});
```

**Impact**: If the API call consistently fails, there would be no server-side record of consent, which could be a GDPR compliance issue.

**Recommended Fix**: Implement retry logic for failed consent API calls, or queue failed attempts for later submission.

### L-4: Analytics Session ID Uses Weak Random Generation

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/lib/analytics.ts` (line 10)

**Description**: The analytics session ID is generated using `Math.random()`:

```typescript
sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
```

`Math.random()` is not cryptographically secure. However, since this is only used for analytics session grouping (not authentication or security), the impact is minimal.

**Impact**: Predictable session IDs could theoretically allow analytics data pollution, but this is not a security-critical function.

**Recommended Fix**: If collision resistance matters, use `crypto.randomUUID()` instead.

### L-5: Admin Login Page Logs User Email on Failed Attempts

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/auth/login/route.ts` (line 93)

**Description**: Failed login attempts log the email address to the console:

```typescript
console.warn(`Login failed for ${email}:`, signInError.message);
```

In a production environment with centralized logging (e.g., Vercel logs), this could expose email addresses in log aggregation systems. The attempt is also logged to the database via `logLoginAttempt()`, which is the proper approach.

**Impact**: PII (email addresses) appearing in application logs may violate data minimization principles.

**Recommended Fix**: Mask or hash the email in console logs, or remove the console.warn in production since the database already captures the attempt.

### L-6: `isAdmin()` Function Does Not Check Role

**File**: `/Users/nikolaipoverud/Documents/dotty-webshop/src/lib/supabase/auth-server.ts` (lines 19-22)

**Description**: The `isAdmin()` utility function only checks if a user is authenticated, not if they have the admin role:

```typescript
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return user !== null;  // Only checks if user exists, not role
}
```

However, this appears to be unused or supplementary, as the actual admin guard (`admin-guard.ts`) correctly checks `user_metadata?.role === 'admin'` and the middleware also verifies the admin role for API routes.

**Impact**: If this function were used for authorization decisions, any authenticated user could gain admin access. Currently mitigated by the proper admin guard being used in API routes.

**Recommended Fix**: Either fix the function to check the admin role, or remove it to avoid confusion:

```typescript
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.user_metadata?.role === 'admin';
}
```

---

## INFORMATIONAL

### I-1: Dependencies Are Reasonably Up-to-Date

**Observation**: The project uses recent versions of all major dependencies:
- Next.js 16.1.1 (current)
- React 19.2.3 (current)
- TypeScript 5.9.3 (current)
- Supabase JS 2.89.0 (current)
- Stripe 20.1.0 (current)
- Zod 4.3.5 (current)
- DOMPurify 3.3.1 (current)

**Note**: `npm audit` could not be run due to environment restrictions. It is recommended to run `npm audit` regularly and address any findings.

### I-2: Environment Variable Exposure is Properly Managed

**Observation**: Only appropriate variables are exposed to the client via `NEXT_PUBLIC_` prefix:
- `NEXT_PUBLIC_SUPABASE_URL` -- Public Supabase URL (safe to expose)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- Anon key with RLS (safe to expose)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` -- Stripe publishable key (designed to be public)
- `NEXT_PUBLIC_SITE_URL` -- Site URL (non-sensitive)
- `NEXT_PUBLIC_DOMAIN_NO` / `NEXT_PUBLIC_DOMAIN_EN` -- Domain config (non-sensitive)

All sensitive keys (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `VIPPS_CLIENT_SECRET`, `CRON_SECRET`, `CHECKOUT_TOKEN_SECRET`) are server-only and never prefixed with `NEXT_PUBLIC_`.

The `server-only` package is correctly used in `admin.ts`, `server.ts`, `public.ts`, and `cached-public.ts` to prevent these modules from being bundled into client code.

### I-3: .gitignore Properly Configured

**Observation**: The `.gitignore` file correctly excludes sensitive files:
- `.env*` -- All environment files
- `*.pem` -- SSL certificates
- `/node_modules` -- Dependencies
- `/.next/` -- Build output

The `.env.example` file contains only placeholder values, not real secrets.

### I-4: Strong Security Headers in Place

**Observation**: The middleware sets comprehensive security headers:
- `X-Frame-Options: DENY` -- Prevents clickjacking
- `X-Content-Type-Options: nosniff` -- Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` -- Legacy XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` -- Limits referrer leakage
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` -- Restricts browser APIs
- `Strict-Transport-Security` -- HSTS in production with preload
- `Content-Security-Policy` -- Present (see M-3 for improvement areas)

### I-5: Strong Server-Side Validation for Checkout

**Observation**: The checkout process is well-protected against client-side manipulation:
- Server-side price validation in `checkout-validation.ts` uses database prices, not client-submitted prices
- CSRF protection via HMAC-signed checkout tokens with timing-safe comparison
- Rate limiting on login with IP-based tracking and fail-closed behavior in production
- Stock quantity checks during checkout
- Discount code validation server-side with expiration and usage tracking

---

## Positive Security Practices Noted

1. **DOMPurify sanitization**: The admin customers page properly sanitizes HTML before rendering with `dangerouslySetInnerHTML`.
2. **JSON-LD uses JSON.stringify**: All JSON-LD structured data uses `JSON.stringify()` for serialization within `dangerouslySetInnerHTML`, which inherently prevents XSS since `JSON.stringify` escapes dangerous characters.
3. **Rate limiting with fail-closed**: The rate limiter denies requests when Redis is unavailable in production.
4. **MFA support**: Optional TOTP-based two-factor authentication for admin accounts.
5. **Idle timeout**: Admin sessions auto-expire after 15 minutes of inactivity.
6. **Defense-in-depth**: Admin API routes are protected at both the middleware level and the route handler level.
7. **Proper Supabase client separation**: Browser client uses anon key, admin client uses service role key with `server-only` guard.
8. **Checkout token CSRF protection**: HMAC-signed tokens with timing-safe comparison prevent checkout forgery.
9. **Login attempt logging**: Failed and successful login attempts are recorded for audit purposes.
10. **Image upload validation**: MIME type checking and file size limits on the primary image upload component.
11. **No `eval()` or `innerHTML` usage**: Aside from CSP allowing `unsafe-eval`, the codebase itself does not use `eval()` or direct `innerHTML` assignment (only one safe use of `innerHTML = ''` for clearing an editor).

---

## Recommendations Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| 1 | H-1: Fix open redirect in MFA verify | Low |
| 2 | M-1: Validate checkout redirect URLs | Low |
| 3 | M-3: Tighten CSP (remove `unsafe-eval`) | Medium |
| 4 | M-2: Sanitize newsletter email content | Low |
| 5 | M-4: Add file size validation to gallery upload | Low |
| 6 | L-6: Fix `isAdmin()` function or remove it | Low |
| 7 | L-3: Add retry logic for consent API | Low |
| 8 | L-1: Add `rel="noopener noreferrer"` to sidebar link | Trivial |
| 9 | L-5: Mask email in login failure logs | Low |
| 10 | L-2: Add Zod validation for localStorage cart | Low |

---

*This report covers frontend and client-side code only. A separate server-side/API audit is recommended for complete coverage.*
