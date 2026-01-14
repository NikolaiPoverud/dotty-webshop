'use client';

import { motion } from 'framer-motion';
import { CreditCard, Loader2 } from 'lucide-react';
import type { ShippingOption } from '@/types';
import type { CheckoutText } from '@/lib/i18n/cart-checkout-text';
import { useCart } from '@/components/cart/cart-provider';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryProps {
  t: CheckoutText;
  isLoading: boolean;
  onCheckout: (provider: 'stripe' | 'vipps') => void;
  selectedShipping: ShippingOption | null;
}

export function OrderSummary({ t, isLoading, onCheckout, selectedShipping }: OrderSummaryProps): React.ReactElement {
  const { cart } = useCart();
  const hasDiscount = cart.discountCode && cart.discountAmount > 0;

  // Use selected shipping price if available, otherwise fall back to cart shipping
  const shippingCost = selectedShipping?.priceWithVat ?? cart.shippingCost;

  // Recalculate total with selected shipping
  const total = cart.subtotal + shippingCost + cart.artistLevy - cart.discountAmount;

  return (
    <div className="bg-muted rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">{t.orderSummary}</h2>

      <div className="space-y-4 mb-6">
        {cart.items.map((item) => (
          <div key={item.product.id} className="flex justify-between">
            <span className="text-muted-foreground">
              {item.product.title} x{item.quantity}
            </span>
            <span>{formatPrice(item.product.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-border pt-4 mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.subtotal}</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>

        {cart.artistLevy > 0 && (
          <div className="flex justify-between">
            <div>
              <span className="text-muted-foreground">{t.artistLevy}</span>
              <p className="text-xs text-muted-foreground/70">{t.artistLevyNote}</p>
            </div>
            <span className="text-muted-foreground">+{formatPrice(cart.artistLevy)}</span>
          </div>
        )}

        {hasDiscount && (
          <div className="flex justify-between text-success">
            <span>{t.discount} ({cart.discountCode})</span>
            <span>-{formatPrice(cart.discountAmount)}</span>
          </div>
        )}

        {shippingCost > 0 ? (
          <div className="flex justify-between">
            <div>
              <span className="text-muted-foreground">{t.shippingCost}</span>
              {selectedShipping && (
                <p className="text-xs text-muted-foreground/70">{selectedShipping.name}</p>
              )}
            </div>
            <span>+{formatPrice(shippingCost)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-success">
            <span>{t.shippingCost}</span>
            <span>{t.shippingFree}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
          <span>{t.total}</span>
          <span>{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t.includingVat}</p>
      </div>

      <div className="space-y-3">
        <motion.button
          onClick={() => onCheckout('stripe')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest pop-outline transition-all duration-300 hover:bg-primary-light disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CreditCard className="w-5 h-5" />
          )}
          {isLoading ? t.processing : t.payWithCard}
        </motion.button>

        <motion.button
          onClick={() => onCheckout('vipps')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff5b24] text-white font-semibold text-lg uppercase tracking-widest transition-all duration-300 hover:bg-[#ff5b24]/90 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
            </svg>
          )}
          {isLoading ? t.processing : t.payWithVipps}
        </motion.button>
      </div>
    </div>
  );
}
