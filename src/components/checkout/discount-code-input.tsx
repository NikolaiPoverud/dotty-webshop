'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import type { CheckoutText } from '@/lib/i18n/cart-checkout-text';
import { INPUT_CLASS } from './form-input';

interface DiscountCodeInputProps {
  t: CheckoutText;
  onApplyDiscount: (code: string, amount: number, freeShipping?: boolean) => void;
  existingCode: string | undefined;
  subtotal: number;
}

export function DiscountCodeInput({
  t,
  onApplyDiscount,
  existingCode,
  subtotal,
}: DiscountCodeInputProps): React.ReactElement {
  const [discountInput, setDiscountInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isDisabled = isLoading || !!existingCode;

  function clearMessages(): void {
    setError('');
    setSuccess('');
  }

  async function handleApply(): Promise<void> {
    const code = discountInput.trim();
    if (!code) return;

    setIsLoading(true);
    clearMessages();

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });

      const result = await response.json();

      if (!response.ok || !result.valid) {
        setError(result.error || t.invalidDiscountCode);
        return;
      }

      onApplyDiscount(result.code, result.calculated_discount, result.free_shipping);
      setSuccess(t.discountApplied);
      setDiscountInput('');
    } catch {
      setError(t.discountValidationFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <label className="block text-sm font-medium mb-1">{t.discountCode}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={discountInput}
          onChange={(e) => {
            setDiscountInput(e.target.value);
            clearMessages();
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          disabled={isDisabled}
          placeholder={existingCode ?? ''}
          className={`flex-1 ${INPUT_CLASS} disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={isDisabled || !discountInput.trim()}
          className="px-6 py-4 sm:py-3 bg-muted hover:bg-muted/80 active:bg-muted/80 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.apply}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {success && <p className="mt-2 text-sm text-success">{success}</p>}
    </div>
  );
}
