'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/types';
import { getLocalizedPath, getAlternateLocale } from '@/lib/i18n/get-dictionary';
import { Logo } from '@/components/ui/logo';

const navItems = {
  no: { shop: 'Butikk', cart: 'Handlekurv' },
  en: { shop: 'Shop', cart: 'Cart' },
};

export function Header({ lang }: { lang: Locale }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const altLang = getAlternateLocale(lang);
  const t = navItems[lang];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href={`/${lang}`} className="relative group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Logo size="md" className="h-10 sm:h-12" />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-8">
            <Link
              href={getLocalizedPath(lang, 'shop')}
              className="text-sm uppercase tracking-widest hover:text-primary transition-colors"
            >
              {t.shop}
            </Link>
            <Link
              href={getLocalizedPath(lang, 'cart')}
              className="relative group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
              </motion.div>
            </Link>
            {/* Language Switcher */}
            <Link
              href={`/${altLang}`}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded"
            >
              {altLang.toUpperCase()}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="sm:hidden absolute top-full left-0 right-0 bg-background border-b border-border"
        >
          <nav className="flex flex-col p-4 gap-4">
            <Link
              href={getLocalizedPath(lang, 'shop')}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg uppercase tracking-widest hover:text-primary transition-colors py-2"
            >
              {t.shop}
            </Link>
            <Link
              href={getLocalizedPath(lang, 'cart')}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg uppercase tracking-widest hover:text-primary transition-colors py-2 flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              {t.cart}
            </Link>
            <Link
              href={`/${altLang}`}
              onClick={() => setIsMenuOpen(false)}
              className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2"
            >
              {altLang === 'en' ? 'English' : 'Norsk'}
            </Link>
          </nav>
        </motion.div>
      )}
    </header>
  );
}
