'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import type { Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const text = {
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

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Locale;
}

export function CartPanel({ isOpen, onClose, lang }: CartPanelProps) {
  const { cart, itemCount, updateQuantity, removeItem } = useCart();
  const t = text[lang];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 h-full w-full max-w-md bg-background border-l border-border z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
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
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {itemCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-6">{t.empty}</p>
                  <button
                    onClick={onClose}
                    className="text-primary hover:underline"
                  >
                    {t.continueShopping}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-4 p-3 bg-muted rounded-lg"
                    >
                      {/* Product Image */}
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

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.product.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.product.price)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-background rounded transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-background rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="self-start p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title={t.remove}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - pinned at bottom */}
            {itemCount > 0 && (
              <div className="shrink-0 p-4 border-t border-border space-y-3 bg-background">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.subtotal}</span>
                  <span className="text-lg font-bold">{formatPrice(cart.subtotal)}</span>
                </div>

                {/* Checkout Button */}
                <Link
                  href={getLocalizedPath(lang, 'checkout')}
                  onClick={onClose}
                  className="block w-full"
                >
                  <motion.button
                    className="w-full py-3 bg-primary text-background font-semibold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:bg-primary-light"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t.checkout}
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
