'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';

import type { CartItem, Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { formatPrice } from '@/lib/utils';
import { overlay, slideIn, fadeUp, tap } from '@/lib/animations';

interface CartDictionary {
  title: string;
  empty: string;
  continueShopping: string;
  subtotal: string;
  checkout: string;
  remove: string;
}

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Locale;
  dictionary?: CartDictionary;
}

const fallbackText: Record<Locale, CartDictionary> = {
  no: {
    title: 'Handlekurv',
    empty: 'Handlekurven er tom',
    continueShopping: 'Fortsett handelen',
    subtotal: 'Delsum',
    checkout: 'Til kassen',
    remove: 'Fjern',
  },
  en: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    continueShopping: 'Continue shopping',
    subtotal: 'Subtotal',
    checkout: 'Checkout',
    remove: 'Remove',
  },
};


function getItemKey(item: CartItem): string {
  return item.selectedSize
    ? `${item.product.id}-${item.selectedSize.width}x${item.selectedSize.height}`
    : item.product.id;
}

export function CartPanel({ isOpen, onClose, lang, dictionary }: CartPanelProps): React.ReactNode {
  const { cart, itemCount, updateQuantity, removeItem } = useCart();
  const t = dictionary ?? fallbackText[lang];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />

          <motion.div
            variants={slideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 w-full sm:max-w-md bg-[#0a0a0a] border-l border-border z-[80] flex flex-col shadow-2xl"
            style={{ height: '100vh' }}
          >
            <div className="flex items-center justify-between p-4 border-b-[3px] border-primary">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                {t.title}
                {itemCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({itemCount})
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="p-3 border-2 border-muted-foreground/30 hover:border-primary hover:text-primary active:border-primary active:text-primary transition-all duration-200 touch-manipulation"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {itemCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-6">{t.empty}</p>
                  <button
                    onClick={onClose}
                    className="text-primary hover:underline active:underline py-3 px-4 touch-manipulation"
                  >
                    {t.continueShopping}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => {
                    const displayPrice = item.selectedSize?.price ?? item.product.price;

                    return (
                      <motion.div
                        key={getItemKey(item)}
                        layout
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex gap-4 p-3 bg-muted rounded-lg"
                      >
                        <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                          {item.product.image_url ? (
                            <Image
                              src={item.product.image_url}
                              alt={item.product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.product.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(displayPrice)}
                            {item.selectedSize && (
                              <span className="ml-2 text-primary">
                                • {item.selectedSize.label}
                              </span>
                            )}
                          </p>

                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)
                              }
                              className="p-2.5 hover:bg-background active:bg-background rounded-lg transition-colors touch-manipulation disabled:opacity-40"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)
                              }
                              className="p-2.5 hover:bg-background active:bg-background rounded-lg transition-colors touch-manipulation"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.product.id, item.selectedSize)}
                          className="self-start p-3 -mr-1 text-muted-foreground hover:text-destructive active:text-destructive transition-colors touch-manipulation"
                          title={t.remove}
                          aria-label={t.remove}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {itemCount > 0 && (
              <div className="shrink-0 p-4 border-t-[3px] border-primary space-y-3 bg-[#0a0a0a]">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.subtotal}</span>
                  <span className="text-lg font-bold">{formatPrice(cart.subtotal)}</span>
                </div>

                <Link href={getLocalizedPath(lang, 'checkout')} onClick={onClose} className="block w-full">
                  <motion.button
                    className="w-full py-4 sm:py-3 bg-background border-[3px] border-primary text-primary font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:bg-primary hover:text-background active:bg-primary active:text-background shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_6px_0_0_theme(colors.primary)] hover:-translate-y-0.5 touch-manipulation"
                    whileTap={tap}
                  >
                    {t.checkout}
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
