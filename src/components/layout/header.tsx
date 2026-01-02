'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, Menu, X, Settings, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Locale, Collection } from '@/types';
import { getAlternateLocale, getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { getLanguageSwitchUrl } from '@/lib/domains';
import { Logo } from '@/components/ui/logo';
import { useCart } from '@/components/cart/cart-provider';
import { CartPanel } from '@/components/cart/cart-panel';

const navItems = {
  no: {
    cart: 'Handlekurv',
    shop: 'Shop',
    collections: 'Samlinger',
    allProducts: 'Alle produkter',
    art: 'Kunst',
    about: 'Om',
    contact: 'Kontakt',
  },
  en: {
    cart: 'Cart',
    shop: 'Shop',
    collections: 'Collections',
    allProducts: 'All products',
    art: 'Art',
    about: 'About',
    contact: 'Contact',
  },
};

interface HeaderProps {
  lang: Locale;
  collections?: Collection[];
}

export function Header({ lang, collections = [] }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hostname, setHostname] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();
  const altLang = getAlternateLocale(lang);
  const t = navItems[lang];

  // Get hostname on client side for language switch URL
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // Show header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show header after scrolling 100px
      setIsVisible(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const langSwitchUrl = getLanguageSwitchUrl(pathname, lang, hostname);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isVisible
          ? 'bg-background/90 backdrop-blur-md border-b border-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo - Left */}
          <Link href={`/${lang}`} className="relative group flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Logo size="md" className="h-10 sm:h-12" />
            </motion.div>
          </Link>

          {/* Center Navigation - Desktop */}
          <nav className="hidden sm:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => {
                document.getElementById('art')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm uppercase tracking-widest text-foreground/80 hover:text-primary transition-colors"
            >
              {t.art}
            </button>
            <button
              onClick={() => {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm uppercase tracking-widest text-foreground/80 hover:text-primary transition-colors"
            >
              {t.contact}
            </button>
          </nav>

          {/* Right Actions - Desktop */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Admin Button (Dev) */}
            <Link
              href="/admin/products"
              className="relative group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                title="Admin Panel"
              >
                <Settings className="w-5 h-5 text-primary" />
              </motion.div>
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </motion.div>
            </button>

            {/* Language Switcher */}
            <a
              href={langSwitchUrl}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded"
            >
              {altLang.toUpperCase()}
            </a>
          </div>

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
          className="sm:hidden absolute top-full left-0 right-0 bg-background border-b border-border max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <nav className="flex flex-col p-4 gap-2">
            {/* Main Nav Links */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                document.getElementById('art')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-lg font-semibold uppercase tracking-widest hover:text-primary transition-colors py-3 text-left"
            >
              {t.art}
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-lg font-semibold uppercase tracking-widest hover:text-primary transition-colors py-3 text-left"
            >
              {t.about}
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-lg font-semibold uppercase tracking-widest hover:text-primary transition-colors py-3 text-left"
            >
              {t.contact}
            </button>

            {/* Divider */}
            <div className="border-t border-border my-2" />

            {/* Shop Link */}
            <Link
              href={getLocalizedPath(lang, 'shop')}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-semibold uppercase tracking-widest hover:text-primary transition-colors py-3 flex items-center justify-between"
            >
              {t.shop}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            {/* Collections Section */}
            {collections.length > 0 && (
              <div className="border-t border-border pt-2 mt-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground py-2">
                  {t.collections}
                </p>
                <div className="flex flex-col gap-1">
                  {collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`${getLocalizedPath(lang, 'shop')}?collection=${collection.id}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base hover:text-primary transition-colors py-2 pl-2 border-l-2 border-transparent hover:border-primary"
                    >
                      {collection.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border my-2" />

            {/* Cart */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsCartOpen(true);
              }}
              className="text-lg uppercase tracking-widest hover:text-primary transition-colors py-3 flex items-center gap-2 w-full text-left"
            >
              <ShoppingBag className="w-5 h-5" />
              {t.cart}
              {itemCount > 0 && (
                <span className="ml-auto bg-primary text-background text-xs font-bold px-2 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Admin */}
            <Link
              href="/admin/products"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg uppercase tracking-widest hover:text-primary transition-colors py-3 flex items-center gap-2 text-primary"
            >
              <Settings className="w-5 h-5" />
              Admin
            </Link>

            {/* Language Switcher */}
            <a
              href={langSwitchUrl}
              onClick={() => setIsMenuOpen(false)}
              className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-3"
            >
              {altLang === 'en' ? 'English' : 'Norsk'}
            </a>
          </nav>
        </motion.div>
      )}

      {/* Cart Panel */}
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lang={lang}
      />
    </header>
  );
}
