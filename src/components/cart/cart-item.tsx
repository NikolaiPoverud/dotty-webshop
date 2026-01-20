'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import type { CartItem as CartItemType, Locale } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from './cart-provider';

const translations = {
  no: {
    remove: 'Fjern',
    reserved: 'Reservert',
    expires: 'Utløper',
    original: 'Maleri',
    print: 'Prints',
  },
  en: {
    remove: 'Remove',
    reserved: 'Reserved',
    expires: 'Expires',
    original: 'Painting',
    print: 'Print',
  },
};

const gradients = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
];

function getGradientForId(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

function formatTimeRemaining(expiresAt: string): string {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface CartItemProps {
  item: CartItemType;
  lang: Locale;
}

export const CartItemRow = memo(function CartItemRow({ item, lang }: CartItemProps): React.ReactElement {
  const { removeItem, updateQuantity } = useCart();
  const t = translations[lang];
  const { product, quantity, expiresAt } = item;

  const isPrint = product.product_type === 'print';
  const canIncrement = isPrint && (product.stock_quantity === null || quantity < product.stock_quantity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex gap-4 py-4 border-b border-border"
    >
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 96px, 128px"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${getGradientForId(product.id)}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold truncate">{product.title}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {isPrint ? t.print : t.original}
              {item.selectedSize && (
                <span className="ml-2 text-primary">• {item.selectedSize.label}</span>
              )}
            </p>
          </div>

          <button
            onClick={() => removeItem(product.id, item.selectedSize)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t.remove}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {expiresAt && (
          <p className="text-xs text-warning mt-1">
            {t.reserved} - {t.expires} {formatTimeRemaining(expiresAt)}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          {isPrint ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1, item.selectedSize)}
                className="p-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1, item.selectedSize)}
                disabled={!canIncrement}
                className="p-1 rounded bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Qty: 1</span>
          )}

          <span className="font-semibold">
            {formatPrice((item.selectedSize?.price ?? product.price) * quantity)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
