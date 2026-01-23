import Link from 'next/link';
import type { Locale, ProductListItem } from '@/types';
import { ProductCard } from './product-card';
import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-jsonld';
import { ItemListJsonLd } from '@/components/seo/item-list-jsonld';

export interface FacetBreadcrumb {
  name: string;
  href: string;
}

export interface RelatedFacet {
  label: string;
  href: string;
  count?: number;
}

interface FacetedShopContentProps {
  products: ProductListItem[];
  title: string;
  description: string;
  locale: Locale;
  breadcrumbs: FacetBreadcrumb[];
  relatedFacets?: RelatedFacet[];
  emptyMessage: string;
}

export function FacetedShopContent({
  products,
  title,
  description,
  locale,
  breadcrumbs,
  relatedFacets,
  emptyMessage,
}: FacetedShopContentProps): React.ReactElement {
  const breadcrumbItems = breadcrumbs.map((crumb, index) => ({
    name: crumb.name,
    url: crumb.href,
    position: index + 1,
  }));

  return (
    <>
      {/* JSON-LD Structured Data */}
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd
        name={title}
        description={description}
        products={products}
        lang={locale}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium">{crumb.name}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Page Header */}
      <header className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {locale === 'no'
            ? `${products.length} kunstverk`
            : `${products.length} artworks`}
        </p>
      </header>

      {/* Related Facets Navigation */}
      {relatedFacets && relatedFacets.length > 0 && (
        <nav className="mb-8" aria-label="Related filters">
          <div className="flex flex-wrap gap-2 justify-center">
            {relatedFacets.map((facet) => (
              <Link
                key={facet.href}
                href={facet.href}
                className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm"
              >
                {facet.label}
                {facet.count !== undefined && (
                  <span className="ml-1 text-muted-foreground">({facet.count})</span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Product Grid */}
      <div className="min-h-[400px]">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((product, index) => (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard
                  product={product}
                  lang={locale}
                  index={index}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">
            {emptyMessage}
          </p>
        )}
      </div>
    </>
  );
}
