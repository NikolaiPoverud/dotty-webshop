import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Mail, Shield, RotateCcw } from 'lucide-react';
import { SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';
import type { Dictionary, Locale, Collection } from '@/types';
import { NewsletterForm } from '@/components/landing/newsletter-form';
import { Logo } from '@/components/ui/logo';
import { CookieResetButton } from '@/components/layout/cookie-reset-button';

interface TrustBadgeProps {
  icon: LucideIcon;
  label: string;
}

function TrustBadge({ icon: Icon, label }: TrustBadgeProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

interface FooterProps {
  lang: Locale;
  collections?: Collection[];
  dictionary: Dictionary;
}

export function Footer({ lang, collections = [], dictionary }: FooterProps): React.ReactElement {
  const t = dictionary.footer;
  const currentYear = new Date().getFullYear();

  function getCollectionHref(collection: Collection): string {
    if (collection.slug === 'kunst') {
      return `/${lang}/shop`;
    }
    return `/${lang}/shop/${collection.slug}`;
  }

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <NewsletterForm dictionary={dictionary} />
        </div>

        {collections.length > 0 && (
          <div className="mb-8 pb-8 border-b border-border">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Link
                href={`/${lang}/shop`}
                className="text-sm font-medium text-foreground hover:text-primary active:text-primary transition-colors py-2 px-3 touch-manipulation"
              >
                {t.allProducts}
              </Link>
              {collections.map((collection) => (
                <span key={collection.id} className="flex items-center gap-2 sm:gap-4">
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <Link
                    href={getCollectionHref(collection)}
                    className="text-sm text-muted-foreground hover:text-primary active:text-primary transition-colors py-2 px-3 touch-manipulation"
                  >
                    {collection.name}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8 pb-8 border-b border-border">
          <TrustBadge icon={RotateCcw} label={t.returns} />
          <TrustBadge icon={Shield} label={t.securePayment} />
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link href="/admin/products" title="Admin">
            <Logo size="sm" className="h-8" />
          </Link>

          <div className="flex items-center justify-center gap-2">
            <a
              href="mailto:hei@dotty.no"
              className="p-3 text-muted-foreground hover:text-primary active:text-primary transition-colors touch-manipulation"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com/dottyartwork"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 text-muted-foreground hover:text-primary active:text-primary transition-colors touch-manipulation"
              aria-label="Instagram"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
            <a
              href="https://tiktok.com/@dottyartwork"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 text-muted-foreground hover:text-primary active:text-primary transition-colors touch-manipulation"
              aria-label="TikTok"
            >
              <SiTiktok className="w-5 h-5" />
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:gap-x-4">
            <Link
              href={`/${lang}/privacy`}
              className="text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-2 px-3 touch-manipulation"
            >
              {t.privacy}
            </Link>
            <Link
              href={`/${lang}/terms`}
              className="text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-2 px-3 touch-manipulation"
            >
              {t.terms}
            </Link>
            <CookieResetButton label={t.cookies} />
            <Link
              href={`/${lang}/my-data`}
              className="text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-2 px-3 touch-manipulation"
            >
              {t.myData}
            </Link>
            <Link
              href={`/${lang}/guide`}
              className="text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-2 px-3 touch-manipulation"
            >
              {lang === 'no' ? 'Kunstguider' : 'Guides'}
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>
              &copy; {currentYear}{' '}
              <Link href="/admin/login" className="hover:text-foreground transition-colors">
                Dotty.
              </Link>{' '}
              {t.copyright}.
            </p>
            <p>
              Org.nr: 829736322 | <a href="mailto:hei@dotty.no" className="hover:text-foreground transition-colors">hei@dotty.no</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
