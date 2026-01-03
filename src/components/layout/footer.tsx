'use client';

import Link from 'next/link';
import { Instagram, Shield, RotateCcw, CreditCard } from 'lucide-react';
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
    freeShipping: 'Fri frakt over 1000 kr',
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
    freeShipping: 'Free shipping over 1000 kr',
    shop: 'Shop',
    collections: 'Collections',
    allProducts: 'All products',
  },
};

interface FooterProps {
  lang: Locale;
  collections?: Collection[];
}

export function Footer({ lang, collections = [] }: FooterProps) {
  const t = footerText[lang];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter Section */}
        <div className="mb-12">
          <NewsletterForm lang={lang} />
        </div>

        {/* Shop Links - Collections */}
        {collections.length > 0 && (
          <div className="mb-8 pb-8 border-b border-border">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/${lang}/shop`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {t.allProducts}
              </Link>
              <span className="text-muted-foreground">•</span>
              {collections.map((collection, index) => (
                <span key={collection.id} className="flex items-center gap-4">
                  <Link
                    href={collection.slug === 'kunst' ? `/${lang}/shop` : `/${lang}/shop/${collection.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {collection.name}
                  </Link>
                  {index < collections.length - 1 && (
                    <span className="text-muted-foreground">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8 pb-8 border-b border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RotateCcw className="w-5 h-5 text-primary" />
            <span className="text-sm">{t.returns}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">{t.securePayment}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="text-sm">Stripe</span>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col items-center gap-6">
          {/* Logo - links to admin (hidden access) */}
          <Link href="/admin/products" title="Admin">
            <Logo size="sm" className="h-8" />
          </Link>

          {/* Social + Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href="https://instagram.com/dottyartwork"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
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
              onClick={() => {
                resetCookieConsent();
                window.location.reload();
              }}
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

          {/* Copyright - "Dotty." links to admin (hidden access) */}
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
