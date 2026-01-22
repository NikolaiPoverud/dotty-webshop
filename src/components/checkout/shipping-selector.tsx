'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Truck, Package, MapPin, Leaf } from 'lucide-react';
import type { Dictionary, ShippingOption, Locale } from '@/types';
import { formatPrice } from '@/lib/utils';

interface ShippingSelectorProps {
  postalCode: string;
  countryCode?: string;
  locale: Locale;
  dictionary?: Dictionary;
  selectedOption: ShippingOption | null;
  onSelect: (option: ShippingOption) => void;
  disabled?: boolean;
  freeShipping?: boolean;
}

const DEBOUNCE_MS = 500;

// Fallback text for backwards compatibility when dictionary is not provided
const fallbackText = {
  no: {
    title: 'Velg frakt',
    loading: 'Laster fraktalternativer...',
    enterPostalCode: 'Skriv inn postnummer for å se fraktalternativer',
    noOptions: 'Ingen fraktalternativer tilgjengelig',
    estimated: 'Estimert levering',
    fossilFree: 'fossilfri transport',
    pickup: 'Hentested',
    homeDelivery: 'Hjemlevering',
    error: 'Kunne ikke laste fraktalternativer',
  },
  en: {
    title: 'Select shipping',
    loading: 'Loading shipping options...',
    enterPostalCode: 'Enter postal code to see shipping options',
    noOptions: 'No shipping options available',
    estimated: 'Estimated delivery',
    fossilFree: 'fossil-free transport',
    pickup: 'Pickup point',
    homeDelivery: 'Home delivery',
    error: 'Could not load shipping options',
  },
};

function getDeliveryIcon(deliveryType: string): React.ReactElement {
  switch (deliveryType) {
    case 'pickup':
      return <MapPin className="w-5 h-5" />;
    case 'home_delivery':
      return <Truck className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
}

export function ShippingSelector({
  postalCode,
  countryCode = 'NO',
  locale,
  dictionary,
  selectedOption,
  onSelect,
  disabled = false,
  freeShipping = false,
}: ShippingSelectorProps): React.ReactElement {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid re-fetching when selection changes
  const selectedOptionRef = useRef(selectedOption);
  const onSelectRef = useRef(onSelect);

  // Keep refs in sync
  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const t = dictionary?.shipping ?? fallbackText[locale];

  const fetchShippingOptions = useCallback(async () => {
    if (!postalCode || postalCode.length !== 4) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shipping/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode,
          countryCode,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shipping options');
      }

      const data = await response.json();
      setOptions(data.data || []);

      // Auto-select cheapest option if none selected
      if (data.data?.length > 0 && !selectedOptionRef.current) {
        onSelectRef.current(data.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch shipping options:', err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  }, [postalCode, countryCode, locale, t.error]);

  // Debounced fetch when postal code changes
  useEffect(() => {
    if (postalCode.length === 4) {
      const timer = setTimeout(fetchShippingOptions, DEBOUNCE_MS);
      return () => clearTimeout(timer);
    } else {
      setOptions([]);
    }
  }, [postalCode, fetchShippingOptions]);

  // If postal code is not complete, show placeholder
  if (!postalCode || postalCode.length < 4) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-sm text-center">
          {t.enterPostalCode}
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-muted/50 rounded-lg p-6 border border-border">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">{t.loading}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-error/10 rounded-lg p-4 border border-error/20">
        <p className="text-error text-sm text-center">{error}</p>
      </div>
    );
  }

  // No options
  if (options.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-muted-foreground text-sm text-center">
          {t.noOptions}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{t.title}</h3>
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedOption?.id === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => !disabled && onSelect(option)}
              disabled={disabled}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 bg-muted/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              whileHover={!disabled ? { scale: 1.01 } : undefined}
              whileTap={!disabled ? { scale: 0.99 } : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {getDeliveryIcon(option.deliveryType)}
                  </div>
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{t.estimated}: {option.estimatedDelivery}</span>
                      {option.environmentalInfo?.fossilFreePercentage && option.environmentalInfo.fossilFreePercentage > 50 && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <Leaf className="w-3 h-3" />
                          {Math.round(option.environmentalInfo.fossilFreePercentage)}% {t.fossilFree}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${isSelected ? 'text-primary' : ''}`}>
                    {freeShipping ? (
                      <span className="text-success">Gratis</span>
                    ) : (
                      formatPrice(option.priceWithVat)
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
