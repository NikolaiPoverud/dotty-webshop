'use client';

import Link from 'next/link';
import { Instagram } from 'lucide-react';
import type { Locale } from '@/types';
import { NewsletterForm } from '@/components/landing/newsletter-form';
import { Logo } from '@/components/ui/logo';

const footerText = {
  no: {
    privacy: 'Personvern',
    terms: 'Vilkår',
    copyright: 'Alle rettigheter reservert',
  },
  en: {
    privacy: 'Privacy',
    terms: 'Terms',
    copyright: 'All rights reserved',
  },
};

export function Footer({ lang }: { lang: Locale }) {
  const t = footerText[lang];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter Section */}
        <div className="mb-12">
          <NewsletterForm lang={lang} />
        </div>

        {/* Footer Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
          {/* Logo */}
          <Link href={`/${lang}`}>
            <Logo size="sm" className="h-8" />
          </Link>

          {/* Social + Links */}
          <div className="flex items-center gap-6">
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
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Dotty. {t.copyright}.
          </p>
        </div>
      </div>
    </footer>
  );
}
