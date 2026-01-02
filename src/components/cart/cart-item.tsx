'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import type { CartItem as CartItemType, Locale } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from './cart-provider';

const text = {
  no: {
    remove: 'Fjern',
    reserved: 'Reservert',
    expires: 'Utløper',
  },
  en: {
    remove: 'Remove',
    reserved: 'Reserved',
    expires: 'Expires',
  },
};

// Random gradient for placeholder
const gradients = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
];

interface CartItemProps {
  item: CartItemType;
  lang: Locale;
}

export const CartItemRow = memo(function CartItemRow({ item, lang }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const t = text[lang];
  const { product, quantity, expiresAt } = item;
  const gradient = gradients[parseInt(product.id) % gradients.length];

  // Calculate time remaining if reservation exists
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const remaining = Math.max(0, expires - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const canIncrement = product.product_type === 'print' && product.stock_quantity !== null
    ? quantity < product.stock_quantity
    : product.product_type !== 'original';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex gap-4 py-4 border-b border-border"
    >
      {/* Image */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold truncate">{product.title}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {product.product_type === 'original' ? 'Original' : 'Print'}
            </p>
          </div>

          {/* Remove button */}
          <button
            onClick={() => removeItem(product.id)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t.remove}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reservation warning */}
        {expiresAt && (
          <p className="text-xs text-warning mt-1">
            {t.reserved} - {t.expires} {getTimeRemaining()}
          </p>
        )}

        {/* Quantity and Price */}
        <div className="flex items-center justify-between mt-4">
          {/* Quantity controls - only for prints */}
          {product.product_type === 'print' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="p-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
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

          {/* Price */}
          <span className="font-semibold">
            {formatPrice(product.price * quantity)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
