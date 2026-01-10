'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Mail, Shield, RotateCcw, CreditCard } from 'lucide-react';
import { SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';
import type { Locale, Collection } from '@/types';
import { NewsletterForm } from '@/components/landing/newsletter-form';
import { Logo } from '@/components/ui/logo';
import { resetCookieConsent } from '@/components/gdpr/cookie-consent';

const footerText = {
  no: {
    privacy: 'Personvern',
    terms: 'Vilkår',
    cookies: 'Informasjonskapsler',
    myData: 'Mine data',
    copyright: 'Alle rettigheter reservert',
    returns: '14 dagers returrett',
    securePayment: 'Sikker betaling',
    shop: 'Shop',
    collections: 'Samlinger',
    allProducts: 'Alle produkter',
  },
  en: {
    privacy: 'Privacy',
    terms: 'Terms',
    cookies: 'Cookies',
    myData: 'My Data',
    copyright: 'All rights reserved',
    returns: '14-day returns',
    securePayment: 'Secure payment',
    shop: 'Shop',
    collections: 'Collections',
    allProducts: 'All products',
  },
};

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
}

export function Footer({ lang, collections = [] }: FooterProps): React.ReactElement {
  const t = footerText[lang];
  const currentYear = new Date().getFullYear();

  function getCollectionHref(collection: Collection): string {
    if (collection.slug === 'kunst') {
      return `/${lang}/shop`;
    }
    return `/${lang}/shop/${collection.slug}`;
  }

  function handleCookieReset(): void {
    resetCookieConsent();
    window.location.reload();
  }

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <NewsletterForm lang={lang} />
        </div>

        {collections.length > 0 && (
          <div className="mb-8 pb-8 border-b border-border">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/${lang}/shop`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {t.allProducts}
              </Link>
              {collections.map((collection) => (
                <span key={collection.id} className="flex items-center gap-4">
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href={getCollectionHref(collection)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
          <TrustBadge icon={CreditCard} label="Stripe" />
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link href="/admin/products" title="Admin">
            <Logo size="sm" className="h-8" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href="mailto:hei@dotty.no"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com/dottyartwork"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
            <a
              href="https://tiktok.com/@dottyartwork"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="TikTok"
            >
              <SiTiktok className="w-5 h-5" />
            </a>
            <Link
              href={`/${lang}/privacy`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.privacy}
            </Link>
            <Link
              href={`/${lang}/terms`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.terms}
            </Link>
            <button
              onClick={handleCookieReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.cookies}
            </button>
            <Link
              href={`/${lang}/my-data`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.myData}
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            &copy; {currentYear}{' '}
            <Link href="/admin/login" className="hover:text-foreground transition-colors">
              Dotty.
            </Link>{' '}
            {t.copyright}.
          </p>
        </div>
      </div>
    </footer>
  );
}
