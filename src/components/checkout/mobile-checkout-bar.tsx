'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import type { CheckoutText } from '@/lib/i18n/cart-checkout-text';
import { formatPrice } from '@/lib/utils';

interface MobileCheckoutBarProps {
  total: number;
  t: CheckoutText;
  isLoading: boolean;
  onCheckout: (provider: 'stripe' | 'vipps') => void;
}

export function MobileCheckoutBar({
  total,
  t,
  isLoading,
  onCheckout,
}: MobileCheckoutBarProps): React.ReactElement {
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    function handleFocusIn(e: FocusEvent): void {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        setIsInputFocused(true);
      }
    }
    function handleFocusOut(): void {
      setIsInputFocused(false);
    }
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  if (isInputFocused) return <></>;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border p-3 lg:hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{t.total}</span>
        <span className="text-lg font-bold">{formatPrice(total)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onCheckout('stripe')}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-background font-semibold text-sm uppercase tracking-wider transition-colors hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isLoading ? t.processing : t.payWithCard}
        </button>
        <button
          onClick={() => onCheckout('vipps')}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#ff5b24] text-white font-semibold text-sm uppercase tracking-wider transition-colors hover:bg-[#ff5b24]/90 disabled:opacity-50 touch-manipulation"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isLoading ? t.processing : 'Vipps'}
        </button>
      </div>
    </div>
  );
}
