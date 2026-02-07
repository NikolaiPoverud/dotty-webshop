# Dotty. Pop-Art Webshop

E-commerce application for selling original pop-art artworks and prints.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password + MFA)
- **Storage**: Supabase Storage (artwork bucket)
- **Payments**: Stripe, Vipps
- **Shipping**: Bring Shipping Guide API
- **Email**: Resend API (with React Email templates)
- **Analytics**: Custom event tracking (Supabase-backed)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── products/        # Product CRUD + reorder API
│   │   │   ├── orders/          # Order management API
│   │   │   ├── collections/     # Collection CRUD API
│   │   │   ├── discounts/       # Discount code CRUD API
│   │   │   ├── testimonials/    # Testimonial CRUD API
│   │   │   ├── contact/         # Contact submissions API
│   │   │   ├── upload/          # Image upload API
│   │   │   ├── customers/       # Customer management API
│   │   │   ├── audit-log/       # Audit log API
│   │   │   ├── gdpr-stats/      # GDPR statistics API
│   │   │   ├── data-cleanup/    # Data retention cleanup API
│   │   │   └── test-email/      # Email testing API
│   │   ├── auth/
│   │   │   ├── callback/        # OAuth callback handler
│   │   │   ├── login/           # Login endpoint
│   │   │   └── logout/          # Logout endpoint
│   │   ├── v1/                  # Versioned public API
│   │   │   ├── contact/         # Contact form submission
│   │   │   ├── newsletter/      # Newsletter subscription
│   │   │   ├── discounts/validate/ # Discount validation
│   │   │   ├── shipping/options/   # Shipping options
│   │   │   └── checkout/        # Checkout session
│   │   ├── checkout/
│   │   │   ├── session/         # Stripe checkout session
│   │   │   └── token/           # Checkout token validation
│   │   ├── cron/
│   │   │   ├── cleanup-reservations/ # Cart reservation cleanup
│   │   │   ├── audit-maintenance/    # Audit log maintenance
│   │   │   ├── data-retention/       # GDPR data retention
│   │   │   └── process-email-queue/  # Email queue processor
│   │   ├── gdpr/                # GDPR data request + cookie consent
│   │   ├── newsletter/          # Newsletter confirm/unsubscribe
│   │   ├── contact/             # Public contact form
│   │   └── webhooks/stripe/     # Stripe webhook handler
│   ├── admin/
│   │   ├── login/               # Admin login page
│   │   ├── mfa-verify/          # MFA verification page
│   │   ├── reset-password/      # Password reset page
│   │   ├── settings/security/   # Security settings (MFA)
│   │   ├── products/            # Product management
│   │   │   ├── new/             # Create product
│   │   │   └── [id]/edit/       # Edit product
│   │   ├── orders/              # Order management + new order
│   │   ├── collections/         # Collection management
│   │   ├── discounts/           # Discount code management
│   │   ├── customers/           # Customer management
│   │   ├── testimonials/        # Testimonial management
│   │   ├── contact/             # Contact submissions
│   │   ├── audit-log/           # Audit log viewer
│   │   ├── gdpr/                # GDPR dashboard
│   │   ├── email-test/          # Email template testing
│   │   ├── pdf-converter/       # PDF converter tool
│   │   └── webp-converter/      # WebP image converter
│   ├── [lang]/                  # Localized routes (no/en)
│   │   ├── shop/                # Product shop + product detail
│   │   │   └── [slug]/          # Product detail page
│   │   ├── handlekurv/          # Shopping cart (no)
│   │   ├── cart/                # Shopping cart (en)
│   │   ├── kasse/               # Checkout (no)
│   │   ├── checkout/            # Checkout + success page
│   │   ├── guide/               # Guide listing page
│   │   │   └── [slug]/          # Individual guide articles
│   │   ├── faq/                 # FAQ page
│   │   ├── terms/               # Terms & conditions
│   │   ├── privacy/             # Privacy policy
│   │   ├── my-data/             # GDPR data request page
│   │   ├── sold/ & solgt/       # Sold artworks gallery
│   │   ├── newsletter-confirmed/ # Newsletter confirmation
│   │   └── unsubscribe/         # Newsletter unsubscribe
│   ├── sitemap.ts               # Sitemap index
│   ├── sitemap/[segment]/       # Segmented sitemaps
│   ├── robots.ts                # Robots.txt
│   └── llms.txt/                # LLM-readable site description
├── components/
│   ├── admin/
│   │   ├── admin-layout-wrapper.tsx  # Admin shell with sidebar
│   │   ├── admin-sidebar.tsx    # Navigation sidebar
│   │   ├── analytics-dashboard.tsx # Sales analytics
│   │   ├── image-upload.tsx     # Drag-drop image upload
│   │   ├── gallery-upload.tsx   # Multi-image gallery upload
│   │   ├── size-input.tsx       # Product size input
│   │   ├── mass-edit-modal.tsx  # Bulk product editing
│   │   ├── idle-timeout.tsx     # Admin session timeout
│   │   ├── toast.tsx            # Toast notifications
│   │   └── user-menu.tsx        # User info & logout
│   ├── shop/
│   │   ├── product-card.tsx     # Product display card
│   │   ├── product-grid.tsx     # Animated product grid
│   │   ├── product-detail.tsx   # Full product detail view
│   │   ├── product-gallery.tsx  # Product image gallery
│   │   ├── related-products.tsx # Related products section
│   │   ├── collection-filter.tsx # Collection filtering
│   │   ├── filter-tabs.tsx      # Filter tab navigation
│   │   ├── shop-content.tsx     # Shop page content
│   │   └── faceted-shop-content.tsx # Faceted navigation shop
│   ├── cart/
│   │   ├── cart-provider.tsx    # Cart context provider
│   │   ├── cart-panel.tsx       # Slide-out cart panel
│   │   └── cart-item.tsx        # Individual cart item
│   ├── checkout/
│   │   ├── form-input.tsx       # Checkout form fields
│   │   ├── order-summary.tsx    # Order summary display
│   │   ├── shipping-selector.tsx # Shipping method selector
│   │   ├── discount-code-input.tsx # Discount code entry
│   │   ├── consent-checkboxes.tsx # GDPR consent checkboxes
│   │   ├── error-banner.tsx     # Checkout error display
│   │   └── index.ts             # Barrel export
│   ├── landing/
│   │   ├── hero.tsx             # Homepage hero section
│   │   ├── featured-grid.tsx    # Featured products grid
│   │   ├── artist-statement.tsx # Artist bio section
│   │   ├── testimonials.tsx     # Customer testimonials
│   │   ├── contact-section.tsx  # Contact form
│   │   └── newsletter-form.tsx  # Newsletter signup
│   ├── layout/
│   │   ├── header.tsx           # Site header/navigation
│   │   └── footer.tsx           # Site footer
│   ├── seo/
│   │   ├── json-ld.tsx          # Base JSON-LD component
│   │   ├── product-jsonld.tsx   # Product structured data
│   │   ├── article-jsonld.tsx   # Article structured data
│   │   ├── collection-jsonld.tsx # Collection structured data
│   │   ├── organization-jsonld.tsx # Organization structured data
│   │   ├── website-jsonld.tsx   # Website structured data
│   │   ├── breadcrumb-jsonld.tsx # Breadcrumb structured data
│   │   ├── faq-jsonld.tsx       # FAQ structured data
│   │   ├── review-jsonld.tsx    # Review structured data
│   │   ├── item-list-jsonld.tsx # ItemList structured data
│   │   ├── faq-section.tsx      # FAQ section component
│   │   ├── internal-links.tsx   # Internal linking component
│   │   ├── contextual-links.tsx # Contextual link suggestions
│   │   ├── utils.ts             # SEO utility functions
│   │   └── index.ts             # Barrel export
│   ├── analytics/
│   │   └── page-view-tracker.tsx # Page view analytics
│   ├── gdpr/
│   │   └── cookie-consent.tsx   # Cookie consent banner
│   └── ui/
│       ├── logo.tsx             # Site logo
│       ├── skeleton.tsx         # Loading skeletons
│       └── payment-logos.tsx    # Payment provider logos
├── emails/                      # React Email templates
│   ├── components/              # Shared email components
│   │   ├── layout.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── button.tsx
│   │   └── order-items.tsx
│   ├── newsletter.tsx           # Newsletter email
│   ├── order-confirmation.tsx   # Order confirmation email
│   ├── new-order-alert.tsx      # Admin order alert
│   ├── shipping-notification.tsx # Shipping notification
│   ├── delivery-confirmation.tsx # Delivery confirmation
│   └── utils.ts                 # Email utility functions
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client (SSR)
│   │   ├── admin.ts             # Admin client (service role)
│   │   ├── public.ts            # Public (anon) client
│   │   ├── cached-public.ts     # Cached public client
│   │   └── auth-server.ts       # Server-side auth utilities
│   ├── services/
│   │   ├── product-service.ts   # Product data access
│   │   ├── collection-service.ts # Collection data access
│   │   ├── cart-service.ts      # Cart/reservation logic
│   │   ├── email-queue-service.ts # Email queue processing
│   │   └── index.ts             # Service barrel export
│   ├── seo/
│   │   ├── config.ts            # SEO templates & schema config
│   │   ├── metadata.ts          # Metadata generation
│   │   ├── canonical-rules.ts   # Canonical URL rules
│   │   ├── facets/              # Faceted navigation SEO
│   │   ├── sitemap/             # Sitemap generation
│   │   ├── internal-linking/    # Internal link management
│   │   └── content-templates/   # SEO content generators
│   ├── schemas/
│   │   ├── checkout.ts          # Checkout validation schemas
│   │   └── product.ts           # Product validation schemas
│   ├── auth/
│   │   └── admin-guard.ts       # Admin route protection
│   ├── bring/
│   │   ├── client.ts            # Bring API client
│   │   ├── index.ts             # Bring exports
│   │   └── types.ts             # Bring API types
│   ├── vipps/
│   │   ├── client.ts            # Vipps API client
│   │   └── index.ts             # Vipps exports
│   ├── email/
│   │   ├── resend.ts            # Resend client setup
│   │   ├── send.ts              # Email sending utility
│   │   └── templates.ts         # Email template helpers
│   ├── cache/
│   │   ├── kv-cache.ts          # KV cache implementation
│   │   └── index.ts             # Cache barrel export
│   ├── content/
│   │   └── guides.ts            # Guide article content (typed TS constants)
│   ├── i18n/
│   │   ├── get-dictionary.ts    # Dictionary loader
│   │   ├── cart-checkout-text.ts # Cart/checkout translations
│   │   └── dictionaries/        # JSON translation files (no/en)
│   ├── animations.ts            # Framer Motion animation presets
│   ├── analytics.ts             # Analytics event tracking
│   ├── api-response.ts          # Standardized API responses
│   ├── api-version.ts           # API versioning utility
│   ├── audit.ts                 # Audit logging
│   ├── cache.ts                 # Simple cache utility
│   ├── checkout-token.ts        # Checkout token generation
│   ├── checkout-validation.ts   # Checkout validation logic
│   ├── cron-auth.ts             # Cron job authentication
│   ├── admin-fetch.ts           # Authenticated admin fetcher
│   ├── domains.ts               # Domain configuration
│   ├── pagination.ts            # Pagination utilities
│   ├── product-utils.ts         # Product helper functions
│   ├── rate-limit.ts            # Rate limiting
│   ├── stripe.ts                # Stripe client setup
│   ├── utils.ts                 # formatPrice, slugify, cn
│   └── validation.ts            # Input validation utilities
├── __tests__/
│   ├── setup.ts                 # Test setup
│   └── lib/                     # Library unit tests
├── types/index.ts               # All TypeScript interfaces
└── middleware.ts                 # Auth + i18n routing
```

## Authentication

Admin routes are protected via Supabase Auth with optional MFA:

- **Login**: `/admin/login` - Email/password authentication
- **MFA**: `/admin/mfa-verify` - TOTP verification
- **Password Reset**: `/admin/reset-password`
- **Security Settings**: `/admin/settings/security` - Enable/disable MFA
- **Protected**: All `/admin/*` routes (except login, reset-password)
- **Middleware**: Checks auth token, redirects to login if missing
- **Idle Timeout**: Auto-logout after inactivity

### Auth Flow
```
/admin/* -> Middleware checks auth -> Redirect to /admin/login if not authenticated
                                   -> MFA check -> /admin/mfa-verify if required
                                   -> Allow access if fully authenticated
```

## Database Schema

### Products Table
```sql
- id, title, description, slug, sku, price (ore)
- image_url, image_path (storage)
- product_type: 'original' | 'print'
- stock_quantity (null for originals)
- sizes: jsonb [{width, height, label}]
- is_available, is_featured, is_public, display_order
- requires_inquiry (for price-on-request items)
- shipping_weight_grams, shipping_length_cm, shipping_width_cm, shipping_height_cm
- deleted_at (soft delete)
```

### Other Tables
- `collections` - Product groupings (with soft delete)
- `orders` - Customer orders with payment tracking
- `order_items` - Order line items (junction table)
- `discount_codes` - Percent, fixed amount, or free shipping discounts
- `cart_reservations` - 15-min soft locks
- `newsletter_subscribers` - Email list with double opt-in
- `testimonials` - Customer testimonials
- `contact_submissions` - Contact form entries
- `audit_log` - Admin action audit trail (with retention policy)
- `email_queue` - Queued email processing
- `analytics_events` - Page view and event tracking
- `product_change_history` - Product edit history

## Key Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## API Routes

### Auth
- `GET /api/auth/callback` - OAuth code exchange
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Sign out user

### Admin (requires authentication)
- `GET/POST /api/admin/products` - List/create products
- `PUT /api/admin/products/reorder` - Reorder products
- `GET/PUT/DELETE /api/admin/products/[id]` - Single product ops
- `GET/POST /api/admin/orders` - List/create orders
- `GET/PUT /api/admin/orders/[id]` - Single order ops
- `GET /api/admin/orders/pending-count` - Pending order count
- `GET/POST /api/admin/collections` - List/create collections
- `GET/PUT/DELETE /api/admin/collections/[id]` - Single collection ops
- `GET/POST /api/admin/discounts` - List/create discount codes
- `GET/PUT/DELETE /api/admin/discounts/[id]` - Single discount ops
- `GET/POST /api/admin/testimonials` - List/create testimonials
- `GET/PUT/DELETE /api/admin/testimonials/[id]` - Single testimonial ops
- `GET /api/admin/contact` - List contact submissions
- `PUT/DELETE /api/admin/contact/[id]` - Update/delete submissions
- `GET /api/admin/contact/unread-count` - Unread count
- `GET /api/admin/customers` - Customer list
- `GET /api/admin/audit-log` - Audit log entries
- `GET /api/admin/gdpr-stats` - GDPR compliance stats
- `POST /api/admin/data-cleanup` - Manual data cleanup
- `POST/DELETE /api/admin/upload` - Image upload/delete
- `POST /api/admin/test-email` - Send test email

### Public (versioned)
- `POST /api/v1/contact` - Contact form submission
- `POST /api/v1/newsletter` - Newsletter subscription
- `POST /api/v1/discounts/validate` - Validate discount code
- `POST /api/v1/shipping/options` - Get shipping options
- `POST /api/v1/checkout` - Create checkout session

### Other Public
- `POST /api/checkout/session` - Stripe checkout session
- `GET /api/checkout/token` - Checkout token validation
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `GET /api/newsletter/confirm` - Email confirmation
- `GET /api/newsletter/unsubscribe` - Unsubscribe
- `POST /api/gdpr/cookie-consent` - Cookie preferences
- `POST /api/gdpr/data-request` - GDPR data request
- `GET /api/gdpr/verify-request` - Verify data request

### Cron Jobs
- `GET /api/cron/cleanup-reservations` - Clean expired cart reservations
- `GET /api/cron/audit-maintenance` - Audit log maintenance
- `GET /api/cron/data-retention` - GDPR data retention cleanup
- `GET /api/cron/process-email-queue` - Process queued emails

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
BRING_API_UID=
BRING_API_KEY=
BRING_CUSTOMER_NUMBER=
BRING_FROM_POSTAL_CODE=0173
VIPPS_CLIENT_ID=
VIPPS_CLIENT_SECRET=
VIPPS_SUBSCRIPTION_KEY=
VIPPS_MERCHANT_SERIAL_NUMBER=
CRON_SECRET=
```

## Migrations

51 migrations in `supabase/migrations/` covering:
- Initial schema + RLS policies
- Product sizes, gallery images, SKU, shipping dimensions
- Soft deletes, collection shipping costs
- Order items junction table, order transactions
- Enum types, order numbers, payment columns
- Audit logging with retention
- Email queue, GDPR compliance
- Analytics events, product change history
- Security hardening (RLS fixes, constraints, indexes)

## Localization

- Default: Norwegian (no)
- Supported: English (en)
- Route: `/no/shop` = `/en/shop`
- Dictionaries: `src/lib/i18n/dictionaries/no.json` and `en.json`

## Design System

- Dark theme with hot pink primary (#ec4899)
- Custom classes: `.glow-pink`, `.halftone-pattern`, `.gradient-text`
- Framer Motion animation presets in `src/lib/animations.ts`
- Mobile-first responsive design

## Content

- **Guide articles**: Stored as typed TS constants in `src/lib/content/guides.ts`
  - 4 guides: hva-er-pop-art, velg-kunst-til-hjemmet, ta-vare-pa-kunsttrykk, pop-art-historie
  - Rendered at `/[lang]/guide/[slug]`

## SEO

- **Structured data**: JSON-LD components for Product, Article, Organization, Website, FAQ, Breadcrumb, Review, Collection, ItemList
- **Sitemaps**: Segmented sitemap generation via `src/lib/seo/sitemap/`
- **Faceted SEO**: Collection-based faceted navigation with proper canonicals
- **Internal linking**: Automated internal link suggestions and breadcrumbs
- **Content templates**: Auto-generated SEO content for facet pages
- **robots.txt** and **llms.txt** endpoints

## Current Features

- **Authentication**: Supabase Auth with optional MFA for admin area
- **Product Management**: CRUD with image upload, gallery, reordering, mass edit
- **Product Detail Pages**: Full detail view with gallery, size selection, related products
- **Size Management**: Width x height in cm with multiple sizes per product
- **Featured Products**: Homepage highlights
- **Collection Filtering**: Group products with faceted navigation
- **Shopping Cart**: Context-based cart with reservation system
- **Checkout Flow**: Stripe + Vipps payment, Bring shipping, discount codes
- **Order Management**: Admin order creation, status tracking, payment tracking
- **Email System**: React Email templates, email queue, newsletter with double opt-in
- **Contact Form**: Public contact form with admin management
- **Testimonials**: Customer testimonial management
- **Customer Management**: Customer list in admin
- **GDPR Compliance**: Cookie consent, data requests, data retention policies
- **Audit Logging**: Admin action tracking with retention
- **Analytics**: Page view tracking, admin analytics dashboard
- **SEO**: Full structured data, sitemaps, faceted SEO, internal linking
- **Guide/Content Pages**: Educational content articles
- **i18n**: Norwegian/English routing with full dictionary support
- **Sold Gallery**: Showcase of previously sold artworks

## Bring Shipping Integration

The checkout uses Bring Shipping Guide API for dynamic shipping options.

### Configuration
Required environment variables:
```
BRING_API_UID=your-mybring-email@example.com
BRING_API_KEY=your-api-key-from-mybring
BRING_CUSTOMER_NUMBER=optional-for-net-pricing
BRING_FROM_POSTAL_CODE=0173
```

### Flow
1. Customer enters postal code on checkout
2. Frontend fetches shipping options from `/api/v1/shipping/options`
3. Customer selects shipping method
4. Selected shipping cost is included in checkout total

### Supported Services
- Pickup point delivery (Servicepakke, Pakke til hentested)
- Home delivery (Hjemlevering)
- Mailbox delivery (for smaller items)

### Fallback
If Bring API is unavailable, static fallback options are returned.
