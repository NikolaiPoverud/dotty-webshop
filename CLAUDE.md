# Dotty. Pop-Art Webshop

E-commerce application for selling original pop-art artworks and prints.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (artwork bucket)
- **Payments**: Stripe, Vipps
- **Shipping**: Bring Shipping Guide API
- **Email**: Resend API

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── products/        # Product CRUD API
│   │   │   └── upload/          # Image upload API
│   │   ├── auth/
│   │   │   ├── callback/        # OAuth callback handler
│   │   │   └── logout/          # Logout endpoint
│   │   └── products/            # Public products API
│   ├── admin/
│   │   ├── login/               # Admin login page
│   │   ├── products/            # Product management
│   │   │   ├── new/             # Create product
│   │   │   └── [id]/edit/       # Edit product
│   │   ├── orders/              # Order management
│   │   └── dashboard/           # Sales stats
│   └── [lang]/                  # Localized routes (no/en)
│       ├── shop/                # Product shop
│       ├── handlekurv/cart/     # Shopping cart
│       └── kasse/checkout/      # Checkout flow
├── components/
│   ├── admin/
│   │   ├── image-upload.tsx     # Drag-drop image upload
│   │   ├── size-input.tsx       # Product size input
│   │   └── user-menu.tsx        # User info & logout
│   ├── shop/
│   │   ├── product-card.tsx     # Product display card
│   │   └── product-grid.tsx     # Animated product grid
│   └── cart/                    # Cart components
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client (SSR)
│   │   ├── admin.ts             # Admin client (service role)
│   │   └── auth.ts              # Auth utilities
│   ├── i18n/                    # Translations (no/en)
│   └── utils.ts                 # formatPrice, slugify, cn
├── types/index.ts               # All TypeScript interfaces
└── middleware.ts                # Auth + i18n routing
```

## Authentication

Admin routes are protected via Supabase Auth:

- **Login**: `/admin/login` - Email/password authentication
- **Protected**: All `/admin/*` routes (except login)
- **Middleware**: Checks auth token, redirects to login if missing

### Creating Admin Users

Create users in Supabase Dashboard:
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. User can now log in at `/admin/login`

### Auth Flow
```
/admin/* -> Middleware checks auth -> Redirect to /admin/login if not authenticated
                                   -> Allow access if authenticated
```

## Database Schema

### Products Table
```sql
- id, title, description, slug, price (ore)
- image_url, image_path (storage)
- product_type: 'original' | 'print'
- stock_quantity (null for originals)
- sizes: jsonb [{width, height, label}]
- is_available, is_featured, display_order
```

### Other Tables
- `collections` - Product groupings
- `orders` - Customer orders with items JSONB
- `discount_codes` - Percent or fixed amount discounts
- `cart_reservations` - 15-min soft locks
- `newsletter_subscribers` - Email list

## Key Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## API Routes

### Auth
- `GET /api/auth/callback` - OAuth code exchange
- `POST /api/auth/logout` - Sign out user

### Admin (requires authentication)
- `GET/POST /api/admin/products` - List/create products
- `GET/PUT/DELETE /api/admin/products/[id]` - Single product ops
- `POST/DELETE /api/admin/upload` - Image upload/delete

### Public
- `GET /api/products` - List available products
- `POST /api/shipping/options` - Get Bring shipping options

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Migrations

Run migrations in order:
1. `001_initial_schema.sql` - Base tables and RLS
2. `002_add_sizes_and_storage.sql` - Sizes column + storage bucket

## Localization

- Default: Norwegian (no)
- Supported: English (en)
- Route: `/no/shop` = `/en/shop`

## Design System

- Dark theme with hot pink primary (#ec4899)
- Custom classes: `.glow-pink`, `.halftone-pattern`, `.gradient-text`
- Mobile-first responsive design

## Current Features

- **Authentication**: Supabase Auth for admin area
- **Product Management**: CRUD with image upload
- **Size Management**: Width x height in cm
- **Featured Products**: Homepage highlights
- **Collection Filtering**: Group products
- **Shopping Cart**: localStorage persistence
- **Checkout Flow**: Stripe ready
- **i18n**: Norwegian/English routing

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

### API Endpoints
- `POST /api/shipping/options` - Get available shipping options for a postal code

### Flow
1. Customer enters postal code on checkout
2. Frontend fetches shipping options from `/api/shipping/options`
3. Customer selects shipping method
4. Selected shipping cost is included in checkout total

### Supported Services
- Pickup point delivery (Servicepakke, Pakke til hentested)
- Home delivery (Hjemlevering)
- Mailbox delivery (for smaller items)

### Fallback
If Bring API is unavailable, static fallback options are returned.

### Documentation
- Bring Developer Portal: https://developer.bring.com/
- Shipping Guide API: https://developer.bring.com/api/shipping-guide_2/
- MyBring (API credentials): https://www.mybring.com/

## Pending Implementation

- Product detail pages (full implementation)
- Password reset flow
- Product dimensions for accurate shipping quotes
