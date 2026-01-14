# Dotty Webshop - Final Audit Report

**Date:** 2026-01-14
**Status:** NOT PRODUCTION READY
**Verdict:** Critical issues must be resolved before deployment

---

## Executive Summary

Three specialist audits were performed: Security, Architecture, and Database. The webshop demonstrates solid foundational patterns (RLS policies, audit logging, rate limiting) but contains **critical vulnerabilities** that make it unsuitable for production deployment.

---

## TODO Checklist

### CRITICAL - Deploy Blockers

- [x] **SEC-001**: Fix service role key exposure in `/src/app/api/contact/route.ts` - Use `createAdminClient()` instead of direct instantiation – Done – Agent 2 – 4ba270c
- [x] **SEC-002**: Add authentication to Vipps payment routes – Done – Agent 1 – 0afec9e
- [x] **SEC-003**: Add checkout token validation in Stripe webhook to verify sessions originated from this app – Done – Agent 2 – 5f9ac9e
- [x] **ARCH-001**: Implement server-side cart validation before checkout - prices must be re-validated – Done – Agent 2 – 8a457fb
- [x] **ARCH-002**: Add Zod schema validation on checkout endpoint – Done – Agent 1 – f8635d7
- [x] **DB-001**: Fix incorrect order total CHECK constraint (missing shipping_cost and artist_levy) – Done – Agent 2 – ba6c7f4
- [x] **DB-002**: Rename duplicate migration file `011_missing_table_definitions.sql` to `011b_*` – Done – Agent 2 – 41b336d

### HIGH - Fix Within 1 Week

- [x] **SEC-004**: Sanitize HTML in admin newsletter composer with DOMPurify (`/src/app/admin/customers/page.tsx`) – Done – Agent 2 – 35f3f2c
- [x] **SEC-005**: Remove permissive INSERT policy on newsletter_subscribers – Done – Agent 1 – d4e7460
- [x] **SEC-006**: Fix discount code race condition with atomic database function – Done – Agent 2 – 4a66757
- [x] **SEC-007**: Add Zod validation on product creation – Done – Agent 1 – 8296c33
- [x] **SEC-008**: Add rate limiting to admin login route (5 attempts/15 min) – Done – Agent 2 – 9193497
- [x] **ARCH-003**: Standardize API error responses - use `api-response.ts` helpers consistently – Done – Agent 1 – 5f9af4f
- [x] **ARCH-004**: Extract business logic from API routes to service layer – Done – Agent 1 – e115919
- [x] **ARCH-005**: Generate Supabase types: `npx supabase gen types typescript` – Done – Agent 1 – 46dde3b
- [x] **DB-003**: Remove JSONB `items` column from orders (use `order_items` table only) – Done – Agent 1 – c285caa
- [x] **DB-004**: Add `deleted_at IS NULL` filter to public products API – Done – Agent 2 – Already present (3c05999)
- [x] **DB-005**: Add cascade trigger for collection soft delete – Done – Agent 2 – beb6fe4
- [x] **DB-006**: Make `payment_session_id` index unique after data cleanup – Done – Agent 1 – 6735416
- [x] **DB-007**: Add `line_total` computed column to `order_items` – Done – Agent 2 – beb6fe4
- [x] **DB-008**: Add CHECK constraint: `stock_quantity >= 0` – Done – Agent 2 – 8b92e98

### MEDIUM - Fix Within 2 Weeks

- [x] **SEC-009**: Add security headers in middleware (CSP, X-Frame-Options, HSTS) – Done – Agent 2 – 1967f60
- [x] **SEC-010**: Add Vipps credential rotation reminders – Done – Agent 1 – 4b11067
- [x] **SEC-011**: Schedule `cleanup_expired_reservations()` via cron – Done – Agent 1 – ca8a1e9
- [x] **SEC-012**: Add index on `orders.payment_session_id` – Done – Agent 2 – 707bb8e
- [x] **SEC-013**: Return generic error messages to clients, log details server-side – Done – Agent 1 – 6f4517e
- [x] **SEC-014**: Add request ID correlation in logs – Done – Agent 1 – 636bec8
- [x] **SEC-015**: Add user_agent and referer to audit logs – Done – Agent 1 – daf34cc
- [x] **ARCH-006**: Split checkout page (589 lines) into smaller components – Done – Agent 1 – 99460a0
- [x] **ARCH-007**: Add error boundaries for public-facing routes – Done – Agent 1 – bb9cd7f
- [x] **ARCH-008**: Consolidate cart calculation logic into CartService – Done – Agent 1 – ea407ab
- [ ] **ARCH-009**: Move inline translations to dictionary files – In progress – Agent 3
- [x] **ARCH-010**: Implement async queue for email sending (webhook → queue) – Done – Agent 1 – 1fda36c
- [x] **DB-009**: Add composite index `idx_products_active_sorted` – Done – Agent 2 – 707bb8e
- [x] **DB-010**: Add email format validation constraints – Done – Agent 1 – ae1db06
- [x] **DB-011**: Add phone format validation constraints – Done – Agent 1 – 5e70783
- [x] **DB-012**: Add `updated_at` triggers to `discount_codes`, `collections` – Done – Agent 2 – ec26408
- [x] **DB-013**: Add audit log retention policy (partition or archive after 2 years) – Done – Agent 1 – d2cb7ed

### LOW - Backlog

- [x] **ARCH-011**: Add API versioning (`/api/v1/`) – Done – Agent 2 – f28c91d
- [x] **ARCH-012**: Consider Redis/KV caching for collections – Done – Agent 2 – 9846f69
- [x] **DB-014**: Create views for active records (`active_products`, etc.) – Done – Agent 1 – fc2b1b7
- [x] **DB-015**: Add product change history table – Done – Agent 1 – 9100312
- [x] **DB-016**: Add JSONB GIN index for product sizes (if queried) – Done – Agent 1 – 30669b6
- [x] **DB-017**: Schedule cart reservation cleanup via pg_cron – Done – Agent 2 – Already done in SEC-011 (ca8a1e9)

---

## Detailed Findings

### Security Issues

#### CRITICAL

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| SEC-001 | Service role key exposed in API route | `/src/app/api/contact/route.ts:10-13` | Complete database bypass - attacker can read/write ALL data |
| SEC-002 | No auth on Vipps payment routes | `/src/app/api/vipps/initiate/route.ts` | Order injection, inventory exhaustion, GDPR violation |
| SEC-003 | Stripe webhook missing origin validation | `/src/app/api/webhooks/stripe/route.ts` | Crafted webhooks could create fake orders |

#### HIGH

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| SEC-004 | XSS via dangerouslySetInnerHTML | `/src/app/admin/customers/page.tsx:76-78` | Admin session hijacking |
| SEC-005 | Permissive newsletter INSERT policy | RLS policy | Email bombing, GDPR violation |
| SEC-006 | Discount code race condition | Webhook handler | Multiple uses of single-use codes |
| SEC-007 | No input validation on products | `/src/app/api/admin/products/route.ts:77-99` | Data corruption, potential injection |
| SEC-008 | Admin login has no rate limit | `/admin/login` route | Credential stuffing attacks |

### Architecture Issues

#### CRITICAL

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| ARCH-001 | Cart is client-only, no server validation | `cart-provider.tsx` | Price manipulation vulnerability |
| ARCH-002 | Checkout body cast without validation | `/src/app/api/checkout/route.ts` | Security and data integrity |
| ARCH-003 | Non-atomic order fallback processing | Webhook handler | Partial order creation possible |

#### HIGH

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| ARCH-004 | Business logic in API routes | Checkout, products routes | Maintenance burden, testing difficulty |
| ARCH-005 | Inconsistent error response formats | Throughout API | Client confusion, debugging difficulty |
| ARCH-006 | Missing Supabase type generation | Throughout | Runtime type errors |

### Database Issues

#### CRITICAL

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| DB-001 | Order total CHECK constraint incorrect | Migration 011 | Valid orders rejected after shipping/levy |
| DB-002 | Duplicate migration numbering | Two `011_*` files | Non-deterministic migration order |

#### HIGH

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| DB-003 | Dual order items storage (JSONB + table) | `orders.items` + `order_items` | Data inconsistency, storage waste |
| DB-004 | Public products API shows deleted | `/src/app/api/products/route.ts` | Deleted products visible |
| DB-005 | Collection soft delete orphans products | No cascade trigger | Broken relationships |
| DB-006 | Non-unique payment_session_id index | Migration 009 | Duplicate orders possible |
| DB-007 | No line_total constraint on order_items | order_items table | Data integrity gap |
| DB-008 | Stock can go negative | products table | Inventory overselling |

---

## Recommended Migration

Create `/supabase/migrations/021_critical_fixes.sql`:

```sql
-- 1. Fix order total CHECK constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_total_check;
ALTER TABLE orders ADD CONSTRAINT orders_total_check
CHECK (total = subtotal + COALESCE(shipping_cost, 0) + COALESCE(artist_levy, 0) - discount_amount);

-- 2. Add stock non-negative constraint
ALTER TABLE products ADD CONSTRAINT products_stock_non_negative
CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- 3. Add line_total computed column to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total INTEGER
GENERATED ALWAYS AS (price * quantity) STORED;

-- 4. Add composite index for shop page
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_sorted
ON products(display_order) WHERE deleted_at IS NULL;

-- 5. Collection soft delete cascade
CREATE OR REPLACE FUNCTION cascade_collection_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE products SET collection_id = NULL, updated_at = NOW()
    WHERE collection_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS collection_soft_delete_cascade ON collections;
CREATE TRIGGER collection_soft_delete_cascade
AFTER UPDATE ON collections FOR EACH ROW
EXECUTE FUNCTION cascade_collection_soft_delete();
```

---

## Positive Findings

The following are implemented correctly:

- RLS policies on sensitive tables (audit_log, contact_submissions, data_requests)
- CSRF protection with origin validation
- Rate limiting on contact forms and newsletter
- Stripe webhook signature verification
- Magic byte validation for image uploads
- Path traversal prevention in upload route
- Email masking in session retrieval
- Comprehensive audit logging framework
- Idempotency checks in webhook handler
- Soft deletes for data preservation
- Service role isolation (mostly correct)
- Input normalization (email lowercase, discount codes uppercase)
- Atomic inventory decrement function

---

## Testing Checklist Before Production

- [ ] Penetration test Vipps payment flow with forged requests
- [ ] Verify Stripe webhook with replayed/modified events
- [ ] Test admin routes with forged JWT tokens
- [ ] Attempt SQL injection on all user inputs
- [ ] Test XSS payloads in product descriptions, contact forms
- [ ] Verify RLS policies with direct Supabase client calls
- [ ] Load test rate limiters (1000 req/sec)
- [ ] Verify GDPR data export completeness
- [ ] Test file upload with polyglot files (GIF/JS hybrids)
- [ ] Verify CSP doesn't break legitimate functionality

---

## Conclusion

The application has a solid foundation but requires remediation of critical security and data integrity issues before production deployment. Focus on:

1. **Immediate**: SEC-001, SEC-002, SEC-003, DB-001
2. **This Week**: All HIGH severity items
3. **Before Launch**: All MEDIUM items

Estimated effort: 2-3 days for critical fixes, 1 week for full HIGH priority remediation.
