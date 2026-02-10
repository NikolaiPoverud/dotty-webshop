# Security Audit Report - Dotty. Pop-Art Webshop

**Date:** 2026-02-10
**Audited by:** Claude Opus 4.6 (automated)
**Framework:** Next.js 16.1 / TypeScript / Supabase / Stripe / Vipps

---

## Executive Summary

The Dotty webshop demonstrates a **strong security posture** overall, with many best practices already in place: defense-in-depth admin authentication, server-side cart validation, HMAC checkout tokens, Stripe webhook signature verification, comprehensive security headers, and rate limiting on most public endpoints.

However, the audit identified **12 fixable vulnerabilities** plus several items requiring manual attention. All automatically fixable issues have been resolved.

### Vulnerability Summary

| Severity | Found | Fixed | Manual Attention |
|----------|-------|-------|-----------------|
| Critical | 1 | 1 | 0 |
| High | 5 | 4 | 1 |
| Medium | 8 | 7 | 1 |
| Low | 6 | 2 | 4 |
| **Total** | **20** | **14** | **6** |

---

## Fixes Applied

### CRITICAL: Open Redirect in OAuth Callback (FIXED)
**File:** `src/app/api/auth/callback/route.ts`
**Risk:** The `next` query parameter was used directly in `NextResponse.redirect()`. An attacker could craft `/api/auth/callback?code=xxx&next=//evil.com` to redirect authenticated admins to a phishing site.
**Fix:** Added `sanitizeRedirectPath()` that validates the path starts with `/admin/`, doesn't contain `://`, and doesn't start with `//`.

### HIGH: Open Redirect in MFA Verification (FIXED)
**File:** `src/app/admin/mfa-verify/page.tsx`
**Risk:** The `redirect` search param was passed directly to `router.push()`. Same attack vector as above but client-side.
**Fix:** Added validation that redirect starts with `/admin/` and contains no protocol indicators.

### HIGH: Unvalidated PUT Bodies - Collections, Discounts, Testimonials (FIXED)
**Files:** `src/app/api/admin/collections/[id]/route.ts`, `src/app/api/admin/discounts/[id]/route.ts`, `src/app/api/admin/testimonials/[id]/route.ts`
**Risk:** PUT handlers passed raw request body directly to `supabase.update(body)` without field filtering. A compromised admin session could write to arbitrary columns including `id`, `created_at`, or `deleted_at`.
**Fix:** Added `ALLOWED_FIELDS` allowlists to each PUT handler, filtering input to only known updatable fields.

### HIGH: Dependency Vulnerabilities (FIXED)
**Risk:** `next@16.1.1` had 3 high-severity CVEs (DoS via Image Optimizer, HTTP deserialization, PPR memory consumption). `tar` package had 3 high-severity CVEs (arbitrary file overwrite, symlink poisoning).
**Fix:** Updated `next` to 16.1.6, `tar` updated via `npm audit fix`. **0 vulnerabilities remaining.**

### MEDIUM: Missing Rate Limiting - Newsletter Unsubscribe POST (FIXED)
**File:** `src/app/api/newsletter/unsubscribe/route.ts`
**Risk:** No rate limiting on POST endpoint. An attacker could mass-unsubscribe all newsletter subscribers.
**Fix:** Added rate limiting (10 requests/minute per IP).

### MEDIUM: Missing Rate Limiting - Shipping Options (FIXED)
**File:** `src/app/api/shipping/options/route.ts`
**Risk:** No rate limiting. Currently returns static data but would expose Bring API if re-enabled.
**Fix:** Added rate limiting (20 requests/minute per IP).

### MEDIUM: Missing Rate Limiting - Analytics Track (FIXED)
**File:** `src/app/api/analytics/track/route.ts`
**Risk:** No rate limiting. Attacker could flood analytics with fake events, polluting data and filling database.
**Fix:** Added rate limiting (60 requests/minute per IP), plus input validation for product_id (UUID format), page_path (length cap), and session_id (length cap).

### MEDIUM: Cron Auth Non-Timing-Safe Comparison (FIXED)
**File:** `src/lib/cron-auth.ts`
**Risk:** Used `===` for secret comparison, theoretically vulnerable to timing attacks that could leak the CRON_SECRET byte by byte.
**Fix:** Replaced with `crypto.timingSafeEqual()` via a wrapper function.

### MEDIUM: Audit Log Unbounded Pagination (FIXED)
**File:** `src/app/api/admin/audit-log/route.ts`
**Risk:** The `limit` query parameter had no upper bound. `?limit=1000000` could cause massive queries.
**Fix:** Capped limit at 200, added minimum of 1 and page minimum of 1.

### MEDIUM: Contact Form Missing Length Validation (FIXED)
**File:** `src/app/api/contact/route.ts`
**Risk:** Message field had no length limit. Multi-megabyte messages could fill the database.
**Fix:** Added length validation: message max 5000 chars, name max 200 chars, product_title max 300 chars.

### MEDIUM: Supabase Error Messages Leaked to Client (FIXED)
**Files:** `src/app/api/admin/collections/[id]/route.ts`, `src/app/api/admin/audit-log/route.ts`
**Risk:** Raw Supabase error messages (containing table names, constraint names, schema details) returned to client.
**Fix:** Replaced with generic error messages; details still logged server-side.

### LOW: `isAdmin()` Function Didn't Check Role (FIXED)
**File:** `src/lib/supabase/auth-server.ts`
**Risk:** `isAdmin()` only checked if a user existed, not if they had the admin role. If used for authorization, any authenticated user would pass.
**Fix:** Changed to check `user?.user_metadata?.role === 'admin'`.

---

## Items Requiring Manual Attention

### HIGH: Login Endpoint Returns Tokens in Response Body
**File:** `src/app/api/auth/login/route.ts:110-121`
**Issue:** The login endpoint returns `access_token` and `refresh_token` in the JSON response body instead of setting httpOnly cookies. This makes tokens accessible to JavaScript and any XSS vulnerability.
**Why not auto-fixed:** This is a fundamental auth architecture choice. The Supabase JS client on the browser side likely stores these in localStorage (standard Supabase pattern). Switching to httpOnly cookie-only auth requires coordinating client-side auth changes.
**Recommendation:** Evaluate switching to the `@supabase/ssr` cookie-based auth pattern for the login flow, which the middleware already uses.

### MEDIUM: CSP Allows `unsafe-inline` and `unsafe-eval`
**File:** `middleware.ts:134-147`
**Issue:** The Content Security Policy includes `'unsafe-eval'` which significantly weakens XSS protection.
**Why not auto-fixed:** Next.js requires `unsafe-inline` for hydration scripts. Removing `unsafe-eval` may break third-party scripts.
**Recommendation:** Test removing `'unsafe-eval'` from the CSP. If it breaks Stripe or other integrations, consider nonce-based CSP (Next.js has experimental support).

### LOW: Vipps Callback Lacks Signature Verification
**File:** `src/app/api/vipps/callback/route.ts`
**Issue:** The Vipps callback is a public GET endpoint with no HMAC or rate limiting. While it verifies payment status with the Vipps API, the short order reference format (`DOT-XXXXXX`) is enumerable.
**Recommendation:** Add rate limiting and consider adding an HMAC signature to the callback URL generated in `src/app/api/vipps/initiate/route.ts`.

### LOW: Vipps Order Reference Uses Weak Random
**File:** `src/app/api/vipps/initiate/route.ts:108`
**Issue:** Uses `Math.random()` for order references. Not cryptographically secure.
**Recommendation:** Use `crypto.randomBytes()` or `crypto.randomUUID()`.

### LOW: Newsletter Send Includes Unconfirmed Subscribers
**File:** `src/app/api/admin/customers/route.ts:128-131`
**Issue:** Newsletter send query fetches `is_active` subscribers but doesn't filter by `is_confirmed` or `unsubscribed_at`, potentially violating GDPR double opt-in requirements.
**Recommendation:** Add `.eq('is_confirmed', true).is('unsubscribed_at', null)` to the query.

### LOW: Cookie Consent Retry Logic
**File:** `src/components/gdpr/cookie-consent.tsx`
**Issue:** If the server consent API call fails, consent is only recorded in localStorage, which may not satisfy GDPR's demonstrable consent requirement.
**Recommendation:** Implement retry logic for failed consent API calls.

---

## Positive Security Practices (Already in Place)

1. **Defense-in-depth admin auth** - Both middleware and route-level checks with MFA support
2. **Server-side cart price validation** - Database prices used, not client-submitted prices
3. **Stripe webhook signature verification** - Cryptographic signature check before processing
4. **HMAC checkout tokens** - Time-limited tokens with timing-safe comparison
5. **Comprehensive security headers** - CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
6. **Rate limiting with fail-closed** - Production denies all requests when Redis/KV unavailable
7. **Image upload magic byte validation** - Not just MIME type, actual file content verified
8. **Path traversal prevention** - Upload DELETE validates paths with regex, blocks `..`
9. **Parameterized queries** - Supabase query builder prevents SQL injection
10. **HTML escaping** - Email templates use `escapeHtml()` for user content
11. **Email masking** - Order lookup masks customer email addresses
12. **Audit logging** - Comprehensive admin action logging with IP and user agent
13. **Soft deletes** - Most entities use `deleted_at` instead of hard delete
14. **GDPR compliance** - Cookie consent, data export, data deletion, retention cleanup
15. **Zod validation** - Checkout, product, and shipping schemas
16. **DOMPurify** - Used for HTML sanitization in admin views
17. **server-only imports** - Prevents service role key from leaking to client bundles
18. **Sensitive env vars server-only** - No secrets in `NEXT_PUBLIC_` variables
19. **.env files in .gitignore** - Environment files excluded from version control
20. **Duplicate webhook handling** - Idempotent order processing prevents double-charges

---

## Files Modified in This Audit

| File | Change |
|------|--------|
| `src/app/api/auth/callback/route.ts` | Added redirect path sanitization |
| `src/app/admin/mfa-verify/page.tsx` | Added redirect parameter validation |
| `src/app/api/admin/collections/[id]/route.ts` | Added field allowlist for PUT, generic errors |
| `src/app/api/admin/discounts/[id]/route.ts` | Added field allowlist for PUT |
| `src/app/api/admin/testimonials/[id]/route.ts` | Added field allowlist for PUT |
| `src/app/api/newsletter/unsubscribe/route.ts` | Added rate limiting to POST |
| `src/app/api/shipping/options/route.ts` | Added rate limiting |
| `src/app/api/analytics/track/route.ts` | Added rate limiting + input validation |
| `src/app/api/contact/route.ts` | Added message/name/title length validation |
| `src/app/api/admin/audit-log/route.ts` | Capped pagination limit, generic errors |
| `src/lib/cron-auth.ts` | Timing-safe secret comparison |
| `src/lib/supabase/auth-server.ts` | Fixed `isAdmin()` to check role |
| `package.json` / `package-lock.json` | Updated next@16.1.6, tar fix |

---

## Recommendations for Ongoing Security

1. **Run `npm audit` regularly** - Add to CI pipeline
2. **Enable Dependabot/Renovate** - Automated dependency updates
3. **Add CSP reporting** - Use `report-uri` directive to catch violations
4. **Consider WAF** - Vercel's built-in or Cloudflare for DDoS protection
5. **Database RLS review** - Periodically audit Supabase Row Level Security policies
6. **Penetration testing** - Consider professional pentest before scaling
7. **Log aggregation** - Centralize and monitor admin access logs for anomalies
8. **Secret rotation** - Periodically rotate `CRON_SECRET`, `CHECKOUT_TOKEN_SECRET`, API keys
