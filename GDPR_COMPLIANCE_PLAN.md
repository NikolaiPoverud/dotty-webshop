# GDPR Compliance Plan - Dotty. Webshop

**Current Compliance Level: ~35%**
**Target: Full Compliance**

---

## Critical Issues (Must Fix Immediately)

### 1. Cookie Consent Banner
**Status:** Missing
**Risk:** ePrivacy Directive violation

**Fix:**
- [ ] Create `CookieConsent` component with accept/decline
- [ ] Store consent in localStorage + database
- [ ] Only set non-essential cookies after consent
- [ ] Add cookie settings link in footer

### 2. Newsletter Unsubscribe Mechanism
**Status:** Missing (policy claims it exists)
**Risk:** GDPR Article 7 violation

**Fix:**
- [ ] Add `unsubscribe_token` column to `newsletter_subscribers`
- [ ] Create `/api/newsletter/unsubscribe` endpoint
- [ ] Add unsubscribe link to all marketing emails
- [ ] Create unsubscribe confirmation page

### 3. Customer Data Rights Endpoints
**Status:** Missing
**Risk:** GDPR Articles 15, 17, 20 violations

**Fix:**
- [ ] Create `/api/user/data-request` - request data export
- [ ] Create `/api/user/delete-request` - request account deletion
- [ ] Create verification flow (email confirmation)
- [ ] Add "My Data" page with forms for these requests

---

## High Priority Issues

### 4. Newsletter Double Opt-In
**Status:** Single opt-in only
**Risk:** ePrivacy best practice violation

**Fix:**
- [ ] Add `is_confirmed` and `confirmation_token` columns
- [ ] Send confirmation email on signup
- [ ] Require click to activate subscription
- [ ] Only sync confirmed emails to Resend

### 5. Data Retention Policies
**Status:** None defined
**Risk:** GDPR Article 5(1)(e) violation

**Retention Schedule:**
| Data Type | Retention Period | Action After |
|-----------|------------------|--------------|
| Orders | 7 years | Anonymize (legal requirement) |
| Contact submissions | 2 years | Delete |
| Newsletter (active) | Indefinite | Until unsubscribe |
| Newsletter (unsubscribed) | 30 days | Delete |
| Cart reservations | 15 minutes | Delete (already done) |

**Fix:**
- [ ] Document retention in privacy policy
- [ ] Create cleanup cron job/function
- [ ] Add `deleted_at` soft delete columns where needed

### 6. Privacy Policy Updates
**Status:** Incomplete
**Risk:** GDPR Article 13/14 violations

**Missing Information:**
- [ ] Legal basis for processing (contract, legitimate interest)
- [ ] Specific data retention periods
- [ ] Complete list of processors (Stripe, Supabase, Resend)
- [ ] Right to lodge complaint with Datatilsynet (Norwegian DPA)
- [ ] Data transfer mechanisms (EU adequacy)
- [ ] Cookie types and purposes

### 7. Checkout Consent
**Status:** No explicit consent checkbox
**Risk:** Missing consent record

**Fix:**
- [ ] Add "I accept the privacy policy" checkbox (required)
- [ ] Add "Subscribe to newsletter" checkbox (optional, unchecked)
- [ ] Store consent timestamp with order

---

## Medium Priority Issues

### 8. Contact Form Improvements
**Status:** Table exists but not in migrations

**Fix:**
- [ ] Add migration for `contact_submissions` table
- [ ] Add retention policy (auto-delete after 2 years)
- [ ] Add consent notice above form

### 9. Audit Logging
**Status:** None

**Fix:**
- [ ] Log admin data access/deletions
- [ ] Log customer data requests
- [ ] Store logs for compliance audits

### 10. Rate Limiting
**Status:** None on public endpoints

**Fix:**
- [ ] Add rate limiting to `/api/newsletter` (5/min per IP)
- [ ] Add rate limiting to `/api/contact` (5/min per IP)
- [ ] Prevent spam/abuse

---

## Implementation Phases

### Phase 1: Immediate (This Week)
1. Cookie consent banner
2. Newsletter unsubscribe endpoint
3. Privacy policy checkbox on checkout

### Phase 2: User Rights (Next Week)
4. Data export endpoint
5. Data deletion request endpoint
6. "My Data" page for customers

### Phase 3: Newsletter (Week 3)
7. Double opt-in implementation
8. Email templates with unsubscribe links

### Phase 4: Policies & Cleanup (Week 4)
9. Update privacy policy with all details
10. Implement data retention cron jobs
11. Add audit logging

---

## Database Changes Required

```sql
-- Newsletter improvements
ALTER TABLE newsletter_subscribers ADD COLUMN is_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE newsletter_subscribers ADD COLUMN confirmation_token UUID DEFAULT gen_random_uuid();
ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_token UUID DEFAULT gen_random_uuid();
ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribed_at TIMESTAMPTZ;
ALTER TABLE newsletter_subscribers ADD COLUMN consent_ip TEXT;

-- Data requests table
CREATE TABLE data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'export' or 'delete'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  verification_token UUID DEFAULT gen_random_uuid(),
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cookie consent tracking
CREATE TABLE cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_type TEXT NOT NULL, -- 'essential', 'analytics', 'marketing'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  actor_type TEXT NOT NULL, -- 'admin', 'customer', 'system'
  actor_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Files to Create

```
src/
├── components/
│   └── gdpr/
│       ├── cookie-consent.tsx      # Cookie banner component
│       └── data-request-form.tsx   # Customer data request form
├── app/
│   ├── [lang]/
│   │   └── my-data/
│   │       └── page.tsx            # Customer data rights page
│   └── api/
│       ├── newsletter/
│       │   └── unsubscribe/
│       │       └── route.ts        # Unsubscribe endpoint
│       └── user/
│           ├── data-request/
│           │   └── route.ts        # Request export/deletion
│           └── verify-request/
│               └── route.ts        # Verify email for request
```

---

## Third-Party Processor Agreements

Ensure DPAs (Data Processing Agreements) are in place:

| Processor | Purpose | DPA Status |
|-----------|---------|------------|
| Supabase | Database, Auth | Check dashboard |
| Stripe | Payments | Auto-included in ToS |
| Resend | Email | Check dashboard |
| Vercel | Hosting | Check dashboard |

---

## Compliance Checklist

### Before Launch
- [ ] Cookie consent banner live
- [ ] Newsletter has unsubscribe
- [ ] Privacy policy updated with:
  - [ ] All processors listed
  - [ ] Retention periods
  - [ ] User rights explained
  - [ ] Datatilsynet contact info
- [ ] Checkout has privacy checkbox
- [ ] Data request endpoints working

### Ongoing
- [ ] Respond to data requests within 30 days
- [ ] Run retention cleanup monthly
- [ ] Review audit logs quarterly
- [ ] Update privacy policy when adding services

---

## Resources

- **Norwegian DPA (Datatilsynet):** https://www.datatilsynet.no/
- **GDPR Full Text:** https://gdpr-info.eu/
- **Cookie Consent Libraries:**
  - react-cookie-consent
  - cookieconsent (orestbida)
- **Supabase GDPR:** https://supabase.com/docs/guides/platform/gdpr

---

*Last Updated: January 2, 2026*
