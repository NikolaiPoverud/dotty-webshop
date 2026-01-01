# Dotty. SEO Strategy - World-Class Organic Growth

## Executive Summary

**Current State: 3/10** - Basic meta tags exist but critical SEO infrastructure is missing.

### Critical Issues (Blocking Organic Traffic)
1. **No sitemap.xml** - Google can't efficiently discover pages
2. **No robots.txt** - No crawl directives
3. **No structured data** - Missing Product, Organization, BreadcrumbList schemas
4. **No page-specific metadata** - Shop, product pages missing titles/descriptions
5. **No canonical URLs** - Risk of duplicate content penalties
6. **No hreflang tags** - Norwegian/English versions not linked for Google
7. **Missing og:image** - Social shares look broken
8. **No generateStaticParams for products** - Product pages not pre-rendered

### Target State: 10/10
Full technical SEO + content strategy optimized for Norwegian art market.

---

## Phase 1: Critical Infrastructure (Week 1)

### 1.1 Create sitemap.xml

```typescript
// src/app/sitemap.ts
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://dotty.no'; // Update with actual domain

export default async function sitemap() {
  const supabase = await createClient();

  // Fetch all products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_available', true);

  // Fetch all collections
  const { data: collections } = await supabase
    .from('collections')
    .select('slug, updated_at');

  const productUrls = (products || []).flatMap((product) => [
    {
      url: `${BASE_URL}/no/shop/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/shop/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  return [
    // Homepage
    { url: `${BASE_URL}/no`, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/en`, lastModified: new Date(), priority: 0.9 },

    // Shop
    { url: `${BASE_URL}/no/shop`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/en/shop`, lastModified: new Date(), priority: 0.8 },

    // Products
    ...productUrls,

    // Static pages
    { url: `${BASE_URL}/no/privacy`, priority: 0.3 },
    { url: `${BASE_URL}/no/terms`, priority: 0.3 },
  ];
}
```

### 1.2 Create robots.txt

```typescript
// src/app/robots.ts
export default function robots() {
  const BASE_URL = 'https://dotty.no';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/', '/kasse/', '/handlekurv/', '/cart/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

### 1.3 Add Product Page Metadata

```typescript
// src/app/[lang]/shop/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const product = await getProduct(slug);

  if (!product) return {};

  const title = lang === 'no'
    ? `${product.title} | Kjøp Pop-Art`
    : `${product.title} | Buy Pop-Art`;

  const description = product.description || (lang === 'no'
    ? `Kjøp ${product.title} - unik pop-art fra Dotty. ${product.product_type === 'original' ? 'Original kunstverk' : 'Limitert trykk'}.`
    : `Buy ${product.title} - unique pop-art from Dotty. ${product.product_type === 'original' ? 'Original artwork' : 'Limited print'}.`);

  const price = (product.price / 100).toFixed(0);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: lang === 'no' ? 'nb_NO' : 'en_US',
      images: product.image_url ? [{ url: product.image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
    alternates: {
      canonical: `https://dotty.no/${lang}/shop/${slug}`,
      languages: {
        'nb-NO': `https://dotty.no/no/shop/${slug}`,
        'en': `https://dotty.no/en/shop/${slug}`,
      },
    },
  };
}

// Pre-render all product pages
export async function generateStaticParams() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_available', true);

  return (products || []).map((product) => ({
    slug: product.slug,
  }));
}
```

### 1.4 Add JSON-LD Structured Data

```typescript
// src/components/seo/product-jsonld.tsx
import type { Product } from '@/types';

interface ProductJsonLdProps {
  product: Product;
  lang: 'no' | 'en';
}

export function ProductJsonLd({ product, lang }: ProductJsonLdProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.image_url,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Dotty.',
    },
    offers: {
      '@type': 'Offer',
      url: `https://dotty.no/${lang}/shop/${product.slug}`,
      priceCurrency: 'NOK',
      price: (product.price / 100).toFixed(2),
      availability: product.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    category: product.product_type === 'original' ? 'Original Artwork' : 'Art Print',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

```typescript
// src/components/seo/organization-jsonld.tsx
export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dotty.',
    url: 'https://dotty.no',
    logo: 'https://dotty.no/logo.png',
    description: 'Pop-art med personlighet. Unike kunstverk som bringer energi og farge til ditt hjem.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NO',
    },
    sameAs: [
      // Add social media URLs
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

---

## Phase 2: Page-Level Optimization (Week 2)

### 2.1 Homepage Metadata

```typescript
// src/app/[lang]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;

  const titles = {
    no: 'Dotty. | Pop-Art Kunst fra Norge - Originaler & Trykk',
    en: 'Dotty. | Pop-Art from Norway - Originals & Prints',
  };

  const descriptions = {
    no: 'Oppdag unik pop-art med personlighet. Kjøp originale kunstverk og limiterte trykk som bringer energi og farge til ditt hjem. Gratis frakt i Norge.',
    en: 'Discover unique pop-art with personality. Buy original artworks and limited prints that bring energy and color to your home. Free shipping in Norway.',
  };

  return {
    title: titles[lang as 'no' | 'en'],
    description: descriptions[lang as 'no' | 'en'],
    openGraph: {
      title: titles[lang as 'no' | 'en'],
      description: descriptions[lang as 'no' | 'en'],
      type: 'website',
      images: [{ url: 'https://dotty.no/og-image.jpg', width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `https://dotty.no/${lang}`,
      languages: {
        'nb-NO': 'https://dotty.no/no',
        'en': 'https://dotty.no/en',
      },
    },
  };
}
```

### 2.2 Shop Page Metadata

```typescript
// src/app/[lang]/shop/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;

  const titles = {
    no: 'Kjøp Pop-Art | Originaler & Trykk | Dotty.',
    en: 'Buy Pop-Art | Originals & Prints | Dotty.',
  };

  const descriptions = {
    no: 'Utforsk vår samling av pop-art. Originale malerier og limiterte trykk. Hver kunstverk er unikt og bringer personlighet til ditt hjem.',
    en: 'Explore our collection of pop-art. Original paintings and limited prints. Each artwork is unique and brings personality to your home.',
  };

  return {
    title: titles[lang as 'no' | 'en'],
    description: descriptions[lang as 'no' | 'en'],
    alternates: {
      canonical: `https://dotty.no/${lang}/shop`,
      languages: {
        'nb-NO': 'https://dotty.no/no/shop',
        'en': 'https://dotty.no/en/shop',
      },
    },
  };
}
```

### 2.3 Fix HTML Lang Attribute

```typescript
// src/app/[lang]/layout.tsx
export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;

  return (
    <>
      <head>
        <link rel="alternate" hrefLang="nb-NO" href="https://dotty.no/no" />
        <link rel="alternate" hrefLang="en" href="https://dotty.no/en" />
        <link rel="alternate" hrefLang="x-default" href="https://dotty.no/no" />
      </head>
      <div className="min-h-screen flex flex-col">
        <Header lang={lang as Locale} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang as Locale} />
      </div>
    </>
  );
}
```

---

## Phase 3: Content & Keywords (Week 3-4)

### 3.1 Target Keywords (Norwegian Market Focus)

**Primary Keywords:**
| Keyword | Search Volume | Difficulty | Priority |
|---------|---------------|------------|----------|
| pop art kunst | 720/mo | Medium | High |
| kjøp kunst online | 480/mo | Medium | High |
| original kunst | 390/mo | Low | High |
| kunsttrykk | 320/mo | Low | High |
| norsk kunst | 590/mo | Medium | Medium |
| moderne kunst norge | 210/mo | Low | High |

**Long-tail Keywords:**
- "kjøp pop art maleri norge"
- "originalt kunstverk til hjemmet"
- "fargerike kunsttrykk"
- "contemporary art oslo"
- "buy scandinavian pop art"

### 3.2 Content Strategy

**Blog/Content Hub (Future):**
```
/no/blogg/
  - "Hvordan velge kunst til stuen"
  - "Pop-art historie og inspirasjon"
  - "Slik henger du opp kunst riktig"
  - "Kunstnerportrett: Dotty"
```

**Collection Landing Pages:**
- Each collection should have unique descriptions (200+ words)
- Include artist statement for each collection
- Add "similar artworks" sections

### 3.3 Image Optimization

```typescript
// All product images should include:
<Image
  src={product.image_url}
  alt={`${product.title} - Pop-art ${product.product_type === 'original' ? 'original' : 'trykk'} av Dotty`}
  title={product.title}
  loading={isAboveFold ? 'eager' : 'lazy'}
  priority={isAboveFold}
/>
```

---

## Phase 4: Technical Performance (Week 4)

### 4.1 Core Web Vitals Checklist

- [ ] LCP < 2.5s - Preload hero image, optimize product images
- [ ] FID < 100ms - Already using Next.js, should be fine
- [ ] CLS < 0.1 - Add width/height to all images, reserve space for fonts

### 4.2 Image Optimization

```typescript
// next.config.ts
const config = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### 4.3 Preload Critical Assets

```typescript
// src/app/[lang]/layout.tsx
<head>
  <link rel="preconnect" href="https://your-supabase-url.supabase.co" />
  <link rel="dns-prefetch" href="https://your-supabase-url.supabase.co" />
</head>
```

---

## Phase 5: Off-Page & Local SEO (Ongoing)

### 5.1 Google Business Profile
- Create/claim "Dotty." business profile
- Add high-quality photos
- Encourage customer reviews

### 5.2 Norwegian Art Directories
- Submit to kunst.no
- Register with Norwegian artist associations
- List on Norwegian e-commerce directories

### 5.3 Backlink Strategy
- Guest posts on Norwegian design/lifestyle blogs
- Press releases for new collections
- Collaborate with Norwegian interior designers

---

## Implementation Priority

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Add sitemap.xml | Critical | Low | 1 |
| Add robots.txt | Critical | Low | 1 |
| Product page metadata | Critical | Medium | 1 |
| Product JSON-LD | High | Medium | 2 |
| Homepage metadata | High | Low | 2 |
| Shop page metadata | High | Low | 2 |
| Hreflang tags | High | Low | 2 |
| generateStaticParams | High | Low | 2 |
| Organization JSON-LD | Medium | Low | 3 |
| BreadcrumbList JSON-LD | Medium | Low | 3 |
| Image alt text audit | Medium | Medium | 3 |
| og:image creation | Medium | Medium | 3 |
| Content/blog strategy | High | High | 4 |

---

## Monitoring & Tools

### Required Setup
1. **Google Search Console** - Submit sitemap, monitor indexing
2. **Google Analytics 4** - Track organic traffic
3. **Bing Webmaster Tools** - Additional search engine coverage

### Monthly Checks
- Index coverage in Search Console
- Core Web Vitals scores
- Keyword ranking positions
- Organic traffic trends

---

## Quick Wins (Do Today)

1. Create `src/app/sitemap.ts`
2. Create `src/app/robots.ts`
3. Add `generateMetadata` to product pages
4. Add `generateStaticParams` to product pages
5. Create `ProductJsonLd` component and add to product detail

**Estimated time: 2-3 hours for critical infrastructure**
