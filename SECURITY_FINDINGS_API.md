# Security Audit Report: Dotty Webshop API Routes

**Date:** 2026-02-10
**Scope:** All API routes in `src/app/api/`, middleware, auth infrastructure, rate limiting, validation
**Auditor:** Automated security review (Claude Opus 4.6)

---

## Executive Summary

The codebase demonstrates a generally solid security posture with defense-in-depth patterns, proper use of Supabase parameterized queries, HMAC-based checkout tokens, and comprehensive rate limiting on public endpoints. However, several medium and high severity issues were identified, primarily around missing input validation on admin update endpoints, an open redirect vulnerability in the auth callback, and inconsistencies in rate limiting coverage.

**Total Findings: 23**
- Critical: 1
- High: 5
- Medium: 10
- Low: 7

---

## Critical Findings

### CRIT-01: Open Redirect in Auth Callback

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/auth/callback/route.ts`, line 7
**Severity:** Critical

**Description:** The `next` query parameter is used directly in a redirect without validation:

```typescript
const next = searchParams.get('next') ?? '/admin/dashboard';
// ...
return NextResponse.redirect(`${origin}${next}`);
```

An attacker can craft a URL like `/api/auth/callback?code=VALID_CODE&next=https://evil.com` or `/api/auth/callback?code=VALID_CODE&next=//evil.com` (protocol-relative URL). After a valid OAuth exchange, the user is redirected to an attacker-controlled domain. This can be used for credential phishing: the user believes they are logging in to the admin panel but ends up on an attacker's lookalike page.

**Attack Scenario:** An attacker sends a legitimate admin user a link to `/api/auth/callback?code=...&next=//attacker.com/admin/login?error=session_expired`. After successful authentication, the user is redirected to a phishing page that looks identical to the admin login, tricking them into entering credentials again.

**Recommended Fix:** Validate that `next` starts with `/` and does not start with `//`. Ideally, allowlist only paths beginning with `/admin/`:

```typescript
const next = searchParams.get('next') ?? '/admin/dashboard';
const safeNext = next.startsWith('/admin/') && !next.startsWith('//') ? next : '/admin/dashboard';
```

---

## High Severity Findings

### HIGH-01: Unvalidated Request Body Passed Directly to Supabase Update (Collections)

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/collections/[id]/route.ts`, line 16-23
**Severity:** High

**Description:** The PUT handler passes the raw JSON body directly to Supabase `.update(body)` without any validation or field filtering:

```typescript
const body = await request.json();
const { data, error } = await supabase
  .from('collections')
  .update(body)
  .eq('id', id)
  .select()
  .single();
```

While the POST handler uses `validate(body, collectionSchema)`, the PUT handler skips all validation. An authenticated admin could potentially set arbitrary columns including `id`, `created_at`, or any other column in the table. If the table schema evolves to include sensitive columns (e.g., `owner_id`, `permissions`), these would be writable without validation.

**Attack Scenario:** A compromised admin session or XSS on the admin panel could send `{ "id": "...", "deleted_at": null }` to undelete collections or modify fields that should be immutable.

**Recommended Fix:** Apply the same `collectionSchema` validation, or use an explicit allowlist of updatable fields.

### HIGH-02: Unvalidated Request Body Passed Directly to Supabase Update (Discounts)

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/discounts/[id]/route.ts`, lines 14-22
**Severity:** High

**Description:** Same pattern as HIGH-01. The PUT handler for discount codes passes raw `body` directly to `.update(body)`:

```typescript
const body = await request.json();
const { data, error } = await supabase
  .from('discount_codes')
  .update(body)
  .eq('id', id)
  .select()
  .single();
```

No validation is performed. An attacker with admin access could set `uses_remaining` to a very large number, modify `is_active`, or manipulate `discount_amount` / `discount_percent` to extreme values.

**Recommended Fix:** Validate using `discountSchema` or an explicit allowlist of updatable fields.

### HIGH-03: Unvalidated Request Body Passed Directly to Supabase Update (Testimonials)

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/testimonials/[id]/route.ts`, lines 42-51
**Severity:** High

**Description:** Same pattern as HIGH-01 and HIGH-02. The PUT handler passes raw body directly:

```typescript
const body = await request.json();
const { data, error } = await supabase
  .from('testimonials')
  .update(body)
  .eq('id', id)
  .select()
  .single();
```

While the POST handler uses `validate(body, testimonialSchema)`, the PUT handler skips validation entirely.

**Recommended Fix:** Apply `testimonialSchema` validation to the PUT handler as well.

### HIGH-04: Login Endpoint Returns Session Tokens in Response Body

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/auth/login/route.ts`, lines 110-121
**Severity:** High

**Description:** The login endpoint returns `access_token` and `refresh_token` directly in the JSON response body:

```typescript
const response = NextResponse.json({
  success: true,
  session: {
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    expires_at: data.session?.expires_at,
  },
});
```

This approach is less secure than using httpOnly cookies for token storage. If there is any XSS vulnerability elsewhere in the admin panel, an attacker can exfiltrate these tokens from JavaScript. The standard Supabase SSR pattern uses httpOnly cookies via `@supabase/ssr`, which the middleware uses, but the login endpoint bypasses that pattern.

**Note:** This endpoint uses a raw `createClient` from `@supabase/supabase-js` instead of the SSR-aware server client, meaning it does not set auth cookies. The client-side code likely stores these tokens in localStorage or handles them via the Supabase JS library, which also uses localStorage by default.

**Attack Scenario:** Any XSS on `*.dotty.no` (including in admin panels) could steal the access and refresh tokens, giving an attacker full admin session control.

**Recommended Fix:** Switch to the SSR-compatible client that stores tokens in httpOnly cookies, or ensure the client stores these tokens securely (not in localStorage).

### HIGH-05: Vipps Callback Lacks Signature Verification

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/vipps/callback/route.ts`, lines 19-147
**Severity:** High

**Description:** The Vipps callback endpoint processes payment status based on a `reference` query parameter, then calls `getPayment(reference)` to verify the status with Vipps. While verifying with the Vipps API is good, the endpoint itself has no authentication or signature verification. Unlike the Stripe webhook (which verifies a cryptographic signature), this Vipps callback is a public GET endpoint that anyone can call.

The mitigation is that the endpoint calls Vipps API to check the actual payment state, so a forged callback with an invalid reference would see a `CREATED` or non-`AUTHORIZED` state. However, there are timing issues: if a legitimate order has reference `DOT-ABC123` and a payment is `AUTHORIZED`, an attacker who guesses or discovers that reference could trigger the callback and potentially cause duplicate order processing or race conditions.

Additionally, no rate limiting is applied to this endpoint.

**Attack Scenario:** An attacker brute-forces short order references (format `DOT-XXXXXX`, only 36^6 possibilities) and triggers callbacks. While the Vipps API check prevents unauthorized payments, this could cause unnecessary API calls and potentially trigger side effects like email sends on already-processed orders.

**Recommended Fix:**
1. Add rate limiting to the callback endpoint
2. Consider using Vipps webhooks with signature verification instead of/in addition to redirect callbacks
3. Add a nonce or HMAC to the callback URL to prevent unauthorized invocation

---

## Medium Severity Findings

### MED-01: Missing Rate Limiting on Analytics Track Endpoint

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/analytics/track/route.ts`, lines 13-37
**Severity:** Medium

**Description:** The `/api/analytics/track` POST endpoint has no rate limiting. An attacker could flood this endpoint with millions of fake analytics events, polluting analytics data and potentially causing database storage issues.

```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as TrackRequest;
    // No rate limiting
    const supabase = createPublicClient();
    await supabase.from('analytics_events').insert({...});
```

**Attack Scenario:** A script sends millions of requests, filling the `analytics_events` table with fake data, making analytics useless and potentially causing storage costs or performance degradation.

**Recommended Fix:** Add rate limiting (e.g., 100 requests per minute per IP).

### MED-02: Missing Rate Limiting on Newsletter Unsubscribe POST Endpoint

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/newsletter/unsubscribe/route.ts`, lines 75-103
**Severity:** Medium

**Description:** The POST handler for unsubscribe accepts an email and unsubscribes it without rate limiting. An attacker could enumerate whether emails are subscribed (the response is identical either way, which is good) but more importantly could use this to unsubscribe all legitimate subscribers by iterating through email lists.

```typescript
export async function POST(request: NextRequest): Promise<NextResponse> {
  // No rate limiting
  const { email } = await request.json();
```

**Attack Scenario:** An attacker with a list of email addresses sends POST requests to unsubscribe all of them, destroying the newsletter subscriber base.

**Recommended Fix:** Add rate limiting (e.g., 10 requests per minute per IP).

### MED-03: Missing Rate Limiting on Newsletter Confirm Endpoint

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/newsletter/confirm/route.ts`, lines 8-60
**Severity:** Medium

**Description:** The confirmation endpoint has no rate limiting. While the token is a UUID (hard to brute-force), lack of rate limiting means an attacker could try to enumerate confirmation tokens.

**Recommended Fix:** Add rate limiting (e.g., 20 requests per minute per IP).

### MED-04: Missing Rate Limiting on Order Lookup Endpoint

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/orders/by-reference/route.ts`, lines 12-61
**Severity:** Medium

**Description:** The order lookup by reference endpoint has no rate limiting. Order references use the format `DOT-XXXXXX` (6 alphanumeric characters), which is only 2.18 billion combinations. While the endpoint requires additional conditions (valid session_id or recent + paid status), an attacker could attempt enumeration.

**Recommended Fix:** Add rate limiting (e.g., 10 requests per minute per IP) and consider logging failed lookups.

### MED-05: Missing Rate Limiting on Shipping Options Endpoint

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/shipping/options/route.ts`, lines 15-32
**Severity:** Medium

**Description:** The shipping options POST endpoint has no rate limiting. While it currently returns static data, if it were switched back to the Bring API, this would allow API abuse against the third-party API.

**Recommended Fix:** Add rate limiting for future-proofing.

### MED-06: Audit Log Pagination Limit Not Bounded

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/audit-log/route.ts`, line 13
**Severity:** Medium

**Description:** The `limit` query parameter is parsed from user input without an upper bound:

```typescript
const limit = parseInt(searchParams.get('limit') || '50');
```

An admin (or compromised admin session) could request `?limit=1000000`, causing a huge database query that could degrade performance or cause timeouts.

**Recommended Fix:** Cap the limit at a reasonable maximum (e.g., 200):

```typescript
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
```

### MED-07: Supabase Error Messages Leaked to Client

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/collections/route.ts`, line 21
**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/collections/[id]/route.ts`, line 30
**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/audit-log/route.ts`, line 38
**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/products/[id]/route.ts`, line 50 (handleSupabaseError)
**Severity:** Medium

**Description:** Several admin routes return the raw Supabase error message to the client:

```typescript
return NextResponse.json({ error: error.message }, { status: 500 });
```

Supabase error messages can contain database column names, constraint names, and schema details, which helps attackers understand the database structure. While these are admin-only endpoints, a compromised session or XSS could leverage this information.

**Recommended Fix:** Return generic error messages to the client and log the detailed error server-side. The `handleApiError` utility exists for this purpose but is not consistently used.

### MED-08: Contact Form Missing Message Length Validation

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/contact/route.ts`, lines 90-101
**Severity:** Medium

**Description:** The contact form validates email format and requires a message, but does not limit the message length:

```typescript
if (!email || !message) {
  return errors.badRequest('Email and message are required');
}
```

An attacker could submit extremely long messages (megabytes), which would be stored in the database and could cause storage issues.

**Attack Scenario:** Automated submissions with multi-megabyte messages, eventually filling the database.

**Recommended Fix:** Add length validation for `name`, `message`, `product_title` fields (e.g., message max 5000 chars, name max 200 chars).

### MED-09: Test Email Endpoint Lacks Email Format Validation

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/test-email/route.ts`, lines 100-106
**Severity:** Medium

**Description:** The test email endpoint validates that `email` is not empty, but does not validate the format:

```typescript
const { email, type = 'test' } = await request.json();
if (!email) {
  return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
}
```

The `type` field is cast to `EmailType` without validation (line 106):
```typescript
const emailType = type as EmailType;
```

If an invalid type is provided, it falls through to the `default` case in `getEmailTemplate`, returning the test template, which is low risk. However, the email field could contain injection patterns.

**Recommended Fix:** Validate email format and validate `type` against the `EMAIL_TYPES` keys.

### MED-10: Customers Endpoint Sends Newsletter to ALL Subscribers Including Unconfirmed

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/customers/route.ts`, lines 128-131
**Severity:** Medium

**Description:** When sending a newsletter (POST handler), the endpoint fetches subscribers where `is_active` is true, but does not filter by `is_confirmed`:

```typescript
const [subscribersResult, ordersResult] = await Promise.all([
  supabase.from('newsletter_subscribers').select('email').eq('is_active', true),
  supabase.from('orders').select('customer_email').not('customer_email', 'is', null),
]);
```

This sends emails to people who have not confirmed their subscription (double opt-in), violating GDPR principles and potentially the newsletter's own double opt-in flow.

**Recommended Fix:** Add `.eq('is_confirmed', true)` to the subscribers query, and also filter out unsubscribed users with `.is('unsubscribed_at', null)`.

---

## Low Severity Findings

### LOW-01: Middleware Matcher Does Not Cover All API Admin Routes

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/middleware.ts`, lines 349-356
**Severity:** Low

**Description:** The middleware matcher has an exclusion pattern that excludes most `api` routes from the general matcher but includes `/api/admin/:path*` as a separate entry:

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|...).*)',
    '/api/admin/:path*',
  ],
};
```

This is correctly configured for defense-in-depth. However, the middleware check at line 340 only checks `user_metadata.role !== 'admin'`, while the `verifyAdminAuth` guard in route handlers performs the same check. This is correct defense-in-depth but could create confusion if the role check logic diverges.

**Recommended Fix:** This is informational. Ensure both checks stay in sync.

### LOW-02: Checkout Token Has Fixed 30-Minute Expiry

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/lib/checkout-token.ts`, line 7
**Severity:** Low

**Description:** The checkout token has a fixed 30-minute expiry (`TOKEN_EXPIRY_MS = 30 * 60 * 1000`). For some users, filling in checkout details may take longer than 30 minutes. Additionally, the token is timestamp-based, meaning an attacker who can observe the approximate time a token was created can reduce the search space (though the HMAC signature still prevents forgery).

**Recommended Fix:** Consider making the expiry configurable and ensure the checkout UX handles expired tokens gracefully with a clear message (which it does - this is informational).

### LOW-03: Product Reorder Endpoint Lacks Array Length Limit

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/admin/products/reorder/route.ts`, lines 26-42
**Severity:** Low

**Description:** The reorder endpoint validates that the array is not empty and that each item has valid shape, but does not limit the array length:

```typescript
if (!Array.isArray(products) || products.length === 0) {
```

An admin could send thousands of items, causing many parallel database updates.

**Recommended Fix:** Add a reasonable maximum (e.g., 500 items).

### LOW-04: CSP Allows unsafe-inline and unsafe-eval for Scripts

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/middleware.ts`, line 136
**Severity:** Low

**Description:** The Content-Security-Policy includes `'unsafe-inline' 'unsafe-eval'` in the script-src directive. While this is common in Next.js applications (which require inline scripts for hydration), it weakens the XSS protection that CSP provides.

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ...",
```

**Recommended Fix:** Consider using nonce-based CSP (`'nonce-...'`) if the framework supports it. Next.js has experimental support for nonce-based CSP. This is a known limitation of many Next.js deployments.

### LOW-05: Cookie Consent Stores IP Address

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/gdpr/cookie-consent/route.ts`, lines 25-28
**Severity:** Low

**Description:** The cookie consent endpoint stores the user's IP address in the `cookie_consents` table. While this may be needed for consent proof, storing IP addresses requires proper retention and deletion policies under GDPR.

**Recommended Fix:** Ensure the data retention cron job also handles `cookie_consents` IP cleanup (it does delete old cookie consents after 1 year, which is acceptable).

### LOW-06: Memory-Based Rate Limiter on Serverless

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/lib/rate-limit.ts`, lines 55-86
**Severity:** Low

**Description:** In development or when Vercel KV is not configured, the rate limiter falls back to an in-memory store. On serverless platforms (Vercel), each function invocation may be on a different instance, making the in-memory rate limiter ineffective. In production, the code properly fails closed when KV is unavailable (lines 102-123), which is good. But during development, rate limiting is easily bypassed.

**Recommended Fix:** This is acceptable for development. The production fail-closed behavior is correct and properly implemented.

### LOW-07: Vipps Initiate Endpoint Uses Short Order Reference

**File:** `/Users/nikolaipoverud/Documents/dotty-webshop/src/app/api/vipps/initiate/route.ts`, line 109
**Severity:** Low

**Description:** Order references are generated using `Math.random().toString(36).substring(2, 8).toUpperCase()`, producing a 6-character alphanumeric string. This has only ~2.18 billion possibilities and uses `Math.random()` which is not cryptographically secure.

```typescript
const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
const reference = `DOT-${randomPart}`;
```

While collision probability is low for a small shop, collisions would cause order processing failures.

**Recommended Fix:** Use `crypto.randomUUID()` or `crypto.randomBytes()` for the random component, and consider longer references.

---

## Positive Security Observations

The following security measures are well-implemented and worth noting:

1. **Defense-in-depth admin auth:** Both middleware and route-level admin authentication checks using Supabase Auth with MFA support.

2. **Server-side cart validation:** The checkout flow validates all prices server-side against the database, preventing price manipulation attacks (`checkout-validation.ts`).

3. **Stripe webhook signature verification:** The Stripe webhook properly verifies the cryptographic signature before processing events.

4. **HMAC-based checkout tokens:** The checkout flow uses time-limited HMAC tokens with timing-safe comparison to prevent CSRF and replay attacks.

5. **Security headers:** Comprehensive security headers including CSP, HSTS, X-Frame-Options, and others are applied via middleware.

6. **Rate limiting on sensitive endpoints:** Login, checkout, contact, newsletter, GDPR requests, and discount validation all have rate limiting.

7. **Input validation schemas:** Zod schemas are used for checkout, product creation, order creation, and shipping requests.

8. **File upload validation:** The image upload endpoint validates magic bytes, not just MIME types, preventing file type spoofing.

9. **Path traversal prevention:** The upload DELETE endpoint validates paths with regex and blocks `..` traversal.

10. **Parameterized queries:** All Supabase queries use the query builder, which parameterizes inputs automatically, preventing SQL injection.

11. **HTML escaping:** The contact form email template uses `escapeHtml()` to prevent HTML injection in notification emails.

12. **Email masking:** Order lookup endpoints mask customer emails before returning them.

13. **Soft deletes:** Most entities use soft delete (`deleted_at`) rather than hard delete, preventing data loss.

14. **Audit logging:** Admin actions are comprehensively logged with IP, user agent, and change details.

15. **Rate limit fail-closed:** In production, when Redis/KV is unavailable, rate limiting denies all requests rather than allowing unlimited access.

16. **GDPR compliance:** Cookie consent, data export, data deletion, and data retention cleanup are all implemented.

---

## Summary of Recommended Actions

### Immediate (Critical/High)
1. **Fix open redirect** in auth callback (CRIT-01)
2. **Add input validation** to collection, discount, and testimonial PUT endpoints (HIGH-01, HIGH-02, HIGH-03)
3. **Evaluate login token handling** - consider httpOnly cookies over response body tokens (HIGH-04)
4. **Add rate limiting and/or HMAC verification** to Vipps callback (HIGH-05)

### Short-term (Medium)
5. Add rate limiting to analytics track, newsletter unsubscribe POST, newsletter confirm, order lookup, and shipping options endpoints
6. Cap audit log pagination limit
7. Replace raw Supabase error messages with generic messages in admin endpoints
8. Add message length validation to contact form
9. Validate email format in test email endpoint
10. Filter newsletter sends to confirmed subscribers only

### Long-term (Low)
11. Consider nonce-based CSP
12. Use cryptographically secure random for Vipps order references
13. Add array length limits to reorder endpoint
