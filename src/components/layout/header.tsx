'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Menu, ShoppingBag, X } from 'lucide-react';

import { CartPanel } from '@/components/cart/cart-panel';
import { useCart } from '@/components/cart/cart-provider';
import { Logo } from '@/components/ui/logo';
import { getLanguageSwitchUrl } from '@/lib/domains';
import { getAlternateLocale, getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { cn } from '@/lib/utils';
import type { Collection, Locale } from '@/types';

interface NavigationDictionary {
  cart: string;
  shop: string;
  collections: string;
  allProducts: string;
  art: string;
  about: string;
  contact: string;
  home: string;
  admin?: string;
}

interface HeaderProps {
  lang: Locale;
  collections?: Collection[];
  dictionary?: NavigationDictionary;
}

const FALLBACK_NAV: Record<Locale, NavigationDictionary> = {
  no: {
    cart: 'Handlekurv',
    shop: 'Shop',
    collections: 'Samlinger',
    allProducts: 'Alle produkter',
    art: 'Kunst',
    about: 'Om',
    contact: 'Kontakt',
    home: 'Hjem',
    admin: 'Admin',
  },
  en: {
    cart: 'Cart',
    shop: 'Shop',
    collections: 'Collections',
    allProducts: 'All products',
    art: 'Art',
    about: 'About',
    contact: 'Contact',
    home: 'Home',
    admin: 'Admin',
  },
};

const NAV_SECTIONS = ['art', 'about', 'contact'] as const;
type NavSection = (typeof NAV_SECTIONS)[number];

export function Header({ lang, collections = [], dictionary }: HeaderProps): React.ReactElement {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hostname, setHostname] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const lastScrollY = useRef(0);

  const { itemCount } = useCart();
  const pathname = usePathname();

  const altLang = getAlternateLocale(lang);
  const t = dictionary ?? FALLBACK_NAV[lang];
  const isHomePage = pathname === `/${lang}` || pathname === '/';
  const langSwitchUrl = getLanguageSwitchUrl(pathname, lang, hostname);

  const isProductPage = pathname?.match(/\/shop\/[^/]+$/) !== null;

  useEffect(() => {
    if (!isProductPage) {
      setIsHidden(false);
    }
  }, [isProductPage]);

  useEffect(() => {
    setHostname(window.location.hostname);
    setActiveHash(window.location.hash);
    lastScrollY.current = window.scrollY;

    function handleHashChange(): void {
      setActiveHash(window.location.hash);
    }

    function handleScroll(): void {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY > 100);

      if (isProductPage) {
        const scrollDelta = currentScrollY - lastScrollY.current;

        if (Math.abs(scrollDelta) > 10) {
          if (scrollDelta > 0 && currentScrollY > 100) {
            setIsHidden(true);
          } else if (scrollDelta < 0) {
            setIsHidden(false);
          }
          lastScrollY.current = currentScrollY;
        }
      }
    }

    function handleOpenCart(): void {
      setIsCartOpen(true);
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('open-cart', handleOpenCart);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-cart', handleOpenCart);
    };
  }, [isProductPage]);

  // Body scroll lock for mobile menu
  useEffect(() => {
    if (!isMenuOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  function handleLogoClick(): void {
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = `/${lang}`;
    }
  }

  function handleNavClick(e: React.MouseEvent, hash: string): void {
    // If not on homepage, navigate explicitly to ensure it works
    if (!isHomePage) {
      e.preventDefault();
      window.location.href = `/${lang}${hash}`;
      return;
    }
    setActiveHash(hash);
  }

  function handleMobileNavClick(e: React.MouseEvent, hash: string): void {
    // If not on homepage, navigate explicitly to ensure it works
    if (!isHomePage) {
      e.preventDefault();
      setIsMenuOpen(false);
      window.location.href = `/${lang}${hash}`;
      return;
    }
    setActiveHash(hash);
    setIsMenuOpen(false);
  }

  function openCart(): void {
    setIsMenuOpen(false);
    setIsCartOpen(true);
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out',
        isVisible || !isHomePage ? 'bg-background/90 backdrop-blur-md' : 'bg-transparent',
        isHidden && isProductPage ? '-translate-y-full' : 'translate-y-0'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button
            onClick={handleLogoClick}
            className="relative group flex-shrink-0"
            aria-label="Go to homepage"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Logo size="lg" className="h-12 sm:h-14" />
            </motion.div>
          </button>

          <nav className="hidden sm:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {!isHomePage && (
              <Link
                href={`/${lang}`}
                className="text-sm uppercase tracking-widest text-foreground/80 hover:text-primary transition-colors"
              >
                {t.home}
              </Link>
            )}
            {NAV_SECTIONS.map((section) => {
              const hash = `#${section}`;
              const isActive = activeHash === hash;
              return (
                <Link
                  key={section}
                  href={`/${lang}${hash}`}
                  onClick={(e) => handleNavClick(e, hash)}
                  className={cn(
                    'text-sm uppercase tracking-widest transition-colors',
                    isActive ? 'text-primary font-medium' : 'text-foreground/80 hover:text-primary'
                  )}
                >
                  {t[section]}
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative group"
              aria-label={itemCount > 0 ? `${t.cart} (${itemCount})` : t.cart}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-xs font-bold rounded-full flex items-center justify-center"
                    role="status"
                    aria-live="polite"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </motion.div>
            </button>

            <a
              href={langSwitchUrl}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border px-2 py-1 rounded"
            >
              {altLang.toUpperCase()}
            </a>
          </div>

          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-3 -mr-2 hover:bg-muted active:bg-muted rounded-lg transition-colors touch-manipulation"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            whileTap={{ scale: 0.95 }}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden absolute top-full left-0 right-0 bg-background border-b-[3px] border-primary max-h-[calc(100dvh-4rem)] overflow-y-auto"
          >
            <nav className="flex flex-col p-5 gap-1">
              {!isHomePage && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Link
                    href={`/${lang}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xl font-bold uppercase tracking-widest hover:text-primary active:text-primary transition-colors py-4 block touch-manipulation"
                  >
                    {t.home}
                  </Link>
                </motion.div>
              )}

              {NAV_SECTIONS.map((section, i) => {
                const hash = `#${section}`;
                const isActive = activeHash === hash;
                return (
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * (i + 1) }}
                  >
                    <Link
                      href={`/${lang}${hash}`}
                      onClick={(e) => handleMobileNavClick(e, hash)}
                      className={cn(
                        'text-xl font-bold uppercase tracking-widest transition-colors py-4 block touch-manipulation',
                        isActive ? 'text-primary' : 'hover:text-primary active:text-primary'
                      )}
                    >
                      {t[section]}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="border-t-2 border-border my-3" />

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link
                  href={getLocalizedPath(lang, 'shop')}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-xl font-bold uppercase tracking-widest hover:text-primary active:text-primary transition-colors py-4 flex items-center justify-between touch-manipulation"
                >
                  {t.shop}
                  <ChevronRight className="w-6 h-6 text-primary" />
                </Link>
              </motion.div>

              {collections.length > 0 && (
                <motion.div
                  className="pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground py-2 font-medium">
                    {t.collections}
                  </p>
                  <div className="flex flex-col">
                    {collections.map((collection, i) => (
                      <motion.div
                        key={collection.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + (i * 0.05) }}
                      >
                        <Link
                          href={`${getLocalizedPath(lang, 'shop')}?collection=${collection.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg hover:text-primary active:text-primary transition-colors py-3 pl-3 border-l-[3px] border-muted hover:border-primary active:border-primary block touch-manipulation"
                        >
                          {collection.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="border-t-2 border-border my-3" />

              <motion.button
                onClick={openCart}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="text-xl font-bold uppercase tracking-widest hover:text-primary active:text-primary transition-colors py-4 flex items-center gap-3 w-full text-left touch-manipulation"
              >
                <ShoppingBag className="w-6 h-6" />
                {t.cart}
                {itemCount > 0 && (
                  <span className="ml-auto bg-primary text-background text-sm font-bold px-3 py-1 rounded-full">
                    {itemCount}
                  </span>
                )}
              </motion.button>

              <motion.a
                href={langSwitchUrl}
                onClick={() => setIsMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base uppercase tracking-widest text-muted-foreground hover:text-primary active:text-primary transition-colors py-4 touch-manipulation"
              >
                {altLang === 'en' ? '🇬🇧 English' : '🇳🇴 Norsk'}
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} lang={lang} />
    </header>
  );
}
