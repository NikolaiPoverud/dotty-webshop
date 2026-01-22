'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  const [lastScrollY, setLastScrollY] = useState(0);

  const { itemCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const altLang = getAlternateLocale(lang);
  const t = dictionary ?? FALLBACK_NAV[lang];
  const isHomePage = pathname === `/${lang}` || pathname === '/';
  const langSwitchUrl = getLanguageSwitchUrl(pathname, lang, hostname);

  // Check if we're on a product detail page (shop/[slug] but not shop index)
  const isProductPage = pathname?.match(/\/shop\/[^/]+$/) !== null;

  // Reset hidden state when leaving product pages
  useEffect(() => {
    if (!isProductPage) {
      setIsHidden(false);
    }
  }, [isProductPage]);

  // Initialize client-side state and set up event listeners
  useEffect(() => {
    setHostname(window.location.hostname);
    setActiveHash(window.location.hash);
    setLastScrollY(window.scrollY);

    function handleHashChange(): void {
      setActiveHash(window.location.hash);
    }

    function handleScroll(): void {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY > 100);

      // On product pages, hide header when scrolling down, show when scrolling up
      if (isProductPage) {
        const scrollDelta = currentScrollY - lastScrollY;

        // Only trigger hide/show after scrolling a minimum distance (10px)
        if (Math.abs(scrollDelta) > 10) {
          if (scrollDelta > 0 && currentScrollY > 100) {
            // Scrolling down - hide header
            setIsHidden(true);
          } else if (scrollDelta < 0) {
            // Scrolling up - show header
            setIsHidden(false);
          }
          setLastScrollY(currentScrollY);
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isProductPage, lastScrollY]);

  function handleLogoClick(): void {
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`/${lang}`);
    }
  }

  function handleNavClick(hash: string): void {
    setActiveHash(hash);
  }

  function handleMobileNavClick(hash: string): void {
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
                  onClick={() => handleNavClick(hash)}
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

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="sm:hidden absolute top-full left-0 right-0 bg-background border-b border-border max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <nav className="flex flex-col p-4 gap-2">
            {!isHomePage && (
              <Link
                href={`/${lang}`}
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-semibold uppercase tracking-widest hover:text-primary transition-colors py-3"
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
                  onClick={() => handleMobileNavClick(hash)}
                  className={cn(
                    'text-lg font-semibold uppercase tracking-widest transition-colors py-3 text-left',
                    isActive ? 'text-primary' : 'hover:text-primary'
                  )}
                >
                  {t[section]}
                </Link>
              );
            })}

            <div className="border-t border-border my-2" />

            <Link
              href={getLocalizedPath(lang, 'shop')}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-semibold uppercase tracking-widest hover:text-primary transition-colors py-3 flex items-center justify-between"
            >
              {t.shop}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

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

            <div className="border-t border-border my-2" />

            <button
              onClick={openCart}
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

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} lang={lang} />
    </header>
  );
}
