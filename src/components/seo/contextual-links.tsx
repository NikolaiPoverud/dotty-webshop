import Link from 'next/link';
import type { Locale } from '@/types';

/**
 * Contextual Internal Links Component
 *
 * Displays related links in the content area to improve
 * internal linking and user navigation.
 */

export interface ContextualLink {
  href: string;
  label: string;
  description?: string;
}

interface ContextualLinksProps {
  links: ContextualLink[];
  locale: Locale;
  title?: string;
  variant?: 'inline' | 'grid' | 'list';
}

export function ContextualLinks({
  links,
  locale,
  title,
  variant = 'grid',
}: ContextualLinksProps) {
  if (links.length === 0) {
    return null;
  }

  const sectionTitle = title ?? (locale === 'no' ? 'Utforsk mer' : 'Explore more');

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="text-pink-500 hover:text-pink-400 underline underline-offset-2"
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <section className="mt-8">
        {title && <h3 className="text-lg font-medium mb-3">{sectionTitle}</h3>}
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li key={index}>
              <Link
                href={link.href}
                className="text-pink-500 hover:text-pink-400 inline-flex items-center gap-1"
              >
                <span>{link.label}</span>
                <ArrowIcon />
              </Link>
              {link.description && (
                <span className="text-gray-400 ml-2 text-sm">
                  — {link.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Grid variant (default)
  return (
    <section className="mt-8">
      {title && <h3 className="text-lg font-medium mb-4">{sectionTitle}</h3>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors group"
          >
            <span className="text-pink-500 group-hover:text-pink-400 font-medium">
              {link.label}
            </span>
            {link.description && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                {link.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Hub Links Section
 *
 * Displays prominent links to main hub pages (categories).
 * Used on facet pages to provide clear navigation paths.
 */
interface HubLinksProps {
  locale: Locale;
  currentType?: 'original' | 'print';
  currentPath?: string;
}

export function HubLinks({ locale, currentType, currentPath }: HubLinksProps) {
  const hubLinks: ContextualLink[] = [
    {
      href: `/${locale}/shop`,
      label: locale === 'no' ? 'Alle kunstverk' : 'All artworks',
      description: locale === 'no' ? 'Se hele samlingen' : 'View full collection',
    },
  ];

  // Add type hubs if not already on one
  if (currentType !== 'original') {
    hubLinks.push({
      href: `/${locale}/shop/type/${locale === 'no' ? 'originaler' : 'originals'}`,
      label: locale === 'no' ? 'Originale kunstverk' : 'Original artworks',
      description: locale === 'no' ? 'Unike håndmalte verk' : 'Unique hand-painted works',
    });
  }

  if (currentType !== 'print') {
    hubLinks.push({
      href: `/${locale}/shop/type/${locale === 'no' ? 'trykk' : 'prints'}`,
      label: locale === 'no' ? 'Kunsttrykk' : 'Art prints',
      description: locale === 'no' ? 'Limiterte opplag' : 'Limited editions',
    });
  }

  return (
    <section className="mt-8 mb-6">
      <div className="flex flex-wrap gap-3">
        {hubLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="inline-flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 px-4 py-2 rounded-full transition-colors"
          >
            <span>{link.label}</span>
            <ArrowIcon />
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Related Products Links
 *
 * Shows links to products within a facet with product count indicators.
 */
interface RelatedProductsLinksProps {
  products: Array<{ slug: string; title: string; price?: number }>;
  locale: Locale;
  title?: string;
  maxProducts?: number;
}

export function RelatedProductsLinks({
  products,
  locale,
  title,
  maxProducts = 6,
}: RelatedProductsLinksProps) {
  if (products.length === 0) {
    return null;
  }

  const sectionTitle = title ?? (locale === 'no' ? 'Utvalgte verk' : 'Featured works');
  const displayProducts = products.slice(0, maxProducts);

  return (
    <section className="mt-8">
      <h3 className="text-lg font-medium mb-4">{sectionTitle}</h3>
      <div className="flex flex-wrap gap-2">
        {displayProducts.map((product) => (
          <Link
            key={product.slug}
            href={`/${locale}/shop/${product.slug}`}
            className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-sm"
          >
            {product.title}
          </Link>
        ))}
      </div>
      {products.length > maxProducts && (
        <p className="text-gray-400 text-sm mt-3">
          {locale === 'no'
            ? `+ ${products.length - maxProducts} flere verk`
            : `+ ${products.length - maxProducts} more works`}
        </p>
      )}
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
