/**
 * Internal Links Component
 *
 * Displays related facet links for SEO internal linking.
 * Used on product pages and faceted pages.
 */

import Link from 'next/link';
import type { Locale } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface RelatedFacetLink {
  label: string;
  href: string;
  description?: string;
  count?: number;
}

interface RelatedFacetGroup {
  title: string;
  links: RelatedFacetLink[];
}

// ============================================================================
// Simple Related Links (for product pages)
// ============================================================================

interface RelatedLinksProps {
  links: RelatedFacetLink[];
  title?: string;
  locale: Locale;
}

export function RelatedLinks({ links, title, locale }: RelatedLinksProps) {
  if (links.length === 0) return null;

  const defaultTitle = locale === 'no' ? 'Utforsk lignende' : 'Explore Similar';

  return (
    <nav className="mt-8 pt-8 border-t-2 border-primary" aria-label="Related categories">
      <h3 className="text-lg font-bold mb-4 text-primary uppercase tracking-wider">{title || defaultTitle}</h3>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wider bg-background border-2 border-primary text-primary shadow-[2px_2px_0_0_theme(colors.primary)] hover:bg-primary hover:text-background hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.primary)] transition-all duration-200"
            title={link.description}
          >
            {link.label}
            {link.count !== undefined && (
              <span className="ml-1.5 opacity-70">({link.count})</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

// ============================================================================
// Facet Navigation (for shop and faceted pages)
// ============================================================================

interface FacetNavigationProps {
  groups: RelatedFacetGroup[];
  locale: Locale;
  compact?: boolean;
}

export function FacetNavigation({ groups, locale, compact = false }: FacetNavigationProps) {
  if (groups.length === 0) return null;

  const title = locale === 'no' ? 'Filtrer etter' : 'Filter by';

  if (compact) {
    return (
      <nav className="mb-8" aria-label="Facet filters">
        <h3 className="sr-only">{title}</h3>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {groups.flatMap((group) =>
            group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wider bg-background border-2 border-primary text-primary shadow-[2px_2px_0_0_theme(colors.primary)] hover:bg-primary hover:text-background hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_theme(colors.primary)] transition-all duration-200"
              >
                {link.label}
                {link.count !== undefined && link.count > 0 && (
                  <span className="ml-1.5 opacity-70">({link.count})</span>
                )}
              </Link>
            ))
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="mb-8 p-6 border-2 sm:border-[3px] border-primary shadow-[3px_3px_0_0_theme(colors.primary)] sm:shadow-[4px_4px_0_0_theme(colors.primary)]" aria-label="Facet filters">
      <h3 className="text-lg font-bold mb-4 text-primary uppercase tracking-wider">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="font-bold text-sm text-primary mb-2 uppercase tracking-wide">{group.title}</h4>
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.count !== undefined && link.count > 0 && (
                      <span className="text-muted-foreground/60 text-xs">({link.count})</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

// ============================================================================
// Breadcrumb Links (visual representation)
// ============================================================================

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbLinksProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbLinks({ items }: BreadcrumbLinksProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground/50">/</span>
            )}
            {index === items.length - 1 ? (
              <span className="text-foreground font-medium" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================================================
// Combined Internal Links Section
// ============================================================================

interface InternalLinksSectionProps {
  relatedLinks?: RelatedFacetLink[];
  facetGroups?: RelatedFacetGroup[];
  locale: Locale;
  showFacetNav?: boolean;
}

export function InternalLinksSection({
  relatedLinks,
  facetGroups,
  locale,
  showFacetNav = true,
}: InternalLinksSectionProps) {
  const hasRelatedLinks = relatedLinks && relatedLinks.length > 0;
  const hasFacetGroups = showFacetNav && facetGroups && facetGroups.length > 0;

  if (!hasRelatedLinks && !hasFacetGroups) return null;

  return (
    <section className="mt-12">
      {hasFacetGroups && (
        <FacetNavigation groups={facetGroups} locale={locale} />
      )}
      {hasRelatedLinks && (
        <RelatedLinks links={relatedLinks} locale={locale} />
      )}
    </section>
  );
}
