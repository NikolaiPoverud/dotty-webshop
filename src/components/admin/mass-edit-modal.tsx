'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';

import { adminFetch } from '@/lib/admin-fetch';
import type { Collection, Product, ProductSize, ShippingSize } from '@/types';
import { SHIPPING_SIZE_INFO } from '@/types';
import { SizeInput } from './size-input';

interface MassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  collections: Collection[];
  onSuccess: () => void;
}

type EditField =
  | 'sizes'
  | 'collection'
  | 'availability'
  | 'featured'
  | 'price_adjust'
  | 'stock'
  | 'shipping_size'
  | 'requires_inquiry';

const SHIPPING_SIZE_OPTIONS = Object.keys(SHIPPING_SIZE_INFO) as ShippingSize[];

export function MassEditModal({
  isOpen,
  onClose,
  selectedProducts,
  collections,
  onSuccess,
}: MassEditModalProps): React.ReactElement {
  const [activeField, setActiveField] = useState<EditField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Field values
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [addSizes, setAddSizes] = useState(true); // true = add, false = replace
  const [collectionId, setCollectionId] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [priceAdjustType, setPriceAdjustType] = useState<'percent' | 'fixed'>('percent');
  const [priceAdjustValue, setPriceAdjustValue] = useState('');
  const [priceAdjustDirection, setPriceAdjustDirection] = useState<'increase' | 'decrease'>('increase');
  const [stockQuantity, setStockQuantity] = useState('');
  const [shippingSize, setShippingSize] = useState<ShippingSize | ''>('');
  const [requiresInquiry, setRequiresInquiry] = useState(false);

  function resetForm(): void {
    setActiveField(null);
    setSizes([]);
    setAddSizes(true);
    setCollectionId('');
    setIsAvailable(true);
    setIsFeatured(false);
    setPriceAdjustType('percent');
    setPriceAdjustValue('');
    setPriceAdjustDirection('increase');
    setStockQuantity('');
    setShippingSize('');
    setRequiresInquiry(false);
    setError(null);
    setSuccess(false);
  }

  function handleClose(): void {
    resetForm();
    onClose();
  }

  async function handleSubmit(): Promise<void> {
    if (!activeField) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updates: Record<string, unknown> = {};

      switch (activeField) {
        case 'sizes':
          // Will be handled per-product
          break;
        case 'collection':
          updates.collection_id = collectionId || null;
          break;
        case 'availability':
          updates.is_available = isAvailable;
          break;
        case 'featured':
          updates.is_featured = isFeatured;
          break;
        case 'stock':
          updates.stock_quantity = parseInt(stockQuantity, 10);
          break;
        case 'shipping_size':
          updates.shipping_size = shippingSize || null;
          break;
        case 'requires_inquiry':
          updates.requires_inquiry = requiresInquiry;
          break;
      }

      // Process each product
      const promises = selectedProducts.map(async (product) => {
        const productUpdates: Record<string, unknown> = { ...updates };

        // Handle sizes specially
        if (activeField === 'sizes') {
          if (addSizes) {
            // Merge sizes, avoiding duplicates
            const existingSizes = product.sizes || [];
            const newSizes = sizes.filter(
              (newSize) =>
                !existingSizes.some(
                  (existing) =>
                    existing.width === newSize.width && existing.height === newSize.height
                )
            );
            productUpdates.sizes = [...existingSizes, ...newSizes];
          } else {
            productUpdates.sizes = sizes;
          }
        }

        // Handle price adjustment
        if (activeField === 'price_adjust' && priceAdjustValue) {
          const adjustValue = parseFloat(priceAdjustValue);
          let newPrice = product.price;

          if (priceAdjustType === 'percent') {
            const multiplier = priceAdjustDirection === 'increase'
              ? 1 + adjustValue / 100
              : 1 - adjustValue / 100;
            newPrice = Math.round(product.price * multiplier);
          } else {
            const fixedAmount = Math.round(adjustValue * 100); // Convert to øre
            newPrice = priceAdjustDirection === 'increase'
              ? product.price + fixedAmount
              : product.price - fixedAmount;
          }

          productUpdates.price = Math.max(100, newPrice); // Min 1 kr
        }

        const response = await adminFetch(`/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productUpdates),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || `Failed to update ${product.title}`);
        }
      });

      await Promise.all(promises);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update products');
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldOptions: { id: EditField; label: string; description: string }[] = [
    { id: 'sizes', label: 'Størrelser', description: 'Legg til eller erstatt størrelser' },
    { id: 'collection', label: 'Samling', description: 'Endre samling' },
    { id: 'availability', label: 'Tilgjengelighet', description: 'Sett tilgjengelig/solgt' },
    { id: 'featured', label: 'Fremhevet', description: 'Vis på forsiden' },
    { id: 'price_adjust', label: 'Prisjustering', description: 'Juster pris prosentvis eller fast' },
    { id: 'stock', label: 'Lagerbeholdning', description: 'Sett antall på lager' },
    { id: 'shipping_size', label: 'Fraktstørrelse', description: 'Endre fraktstørrelse' },
    { id: 'requires_inquiry', label: 'Forespørsel', description: 'Krever forespørsel for kjøp' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border rounded-xl shadow-xl z-50 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Masseredigering</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProducts.length} produkt{selectedProducts.length !== 1 ? 'er' : ''} valgt
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-lg font-medium">Oppdatert!</p>
                </motion.div>
              ) : !activeField ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">Velg hva du vil endre:</p>
                  {fieldOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setActiveField(option.id)}
                      className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveField(null)}
                    className="text-sm text-primary hover:underline"
                  >
                    &larr; Tilbake
                  </button>

                  {activeField === 'sizes' && (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={addSizes}
                            onChange={() => setAddSizes(true)}
                            className="w-4 h-4"
                          />
                          <span>Legg til størrelser</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!addSizes}
                            onChange={() => setAddSizes(false)}
                            className="w-4 h-4"
                          />
                          <span>Erstatt alle størrelser</span>
                        </label>
                      </div>
                      <SizeInput value={sizes} onChange={setSizes} />
                    </div>
                  )}

                  {activeField === 'collection' && (
                    <select
                      value={collectionId}
                      onChange={(e) => setCollectionId(e.target.value)}
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg"
                    >
                      <option value="">Ingen samling</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}

                  {activeField === 'availability' && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={isAvailable}
                          onChange={() => setIsAvailable(true)}
                          className="w-4 h-4"
                        />
                        <span>Tilgjengelig</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isAvailable}
                          onChange={() => setIsAvailable(false)}
                          className="w-4 h-4"
                        />
                        <span>Solgt / Ikke tilgjengelig</span>
                      </label>
                    </div>
                  )}

                  {activeField === 'featured' && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={isFeatured}
                          onChange={() => setIsFeatured(true)}
                          className="w-4 h-4"
                        />
                        <span>Fremhevet</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isFeatured}
                          onChange={() => setIsFeatured(false)}
                          className="w-4 h-4"
                        />
                        <span>Ikke fremhevet</span>
                      </label>
                    </div>
                  )}

                  {activeField === 'price_adjust' && (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={priceAdjustDirection === 'increase'}
                            onChange={() => setPriceAdjustDirection('increase')}
                            className="w-4 h-4"
                          />
                          <span>Øk pris</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={priceAdjustDirection === 'decrease'}
                            onChange={() => setPriceAdjustDirection('decrease')}
                            className="w-4 h-4"
                          />
                          <span>Reduser pris</span>
                        </label>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={priceAdjustType === 'percent'}
                            onChange={() => setPriceAdjustType('percent')}
                            className="w-4 h-4"
                          />
                          <span>Prosent (%)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={priceAdjustType === 'fixed'}
                            onChange={() => setPriceAdjustType('fixed')}
                            className="w-4 h-4"
                          />
                          <span>Fast beløp (kr)</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={priceAdjustValue}
                          onChange={(e) => setPriceAdjustValue(e.target.value)}
                          className="w-full px-4 py-3 bg-muted border border-border rounded-lg pr-12"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {priceAdjustType === 'percent' ? '%' : 'kr'}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeField === 'stock' && (
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg"
                      placeholder="Antall på lager"
                    />
                  )}

                  {activeField === 'shipping_size' && (
                    <select
                      value={shippingSize}
                      onChange={(e) => setShippingSize(e.target.value as ShippingSize | '')}
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg"
                    >
                      <option value="">Velg fraktstørrelse...</option>
                      {SHIPPING_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {SHIPPING_SIZE_INFO[size].label} - {SHIPPING_SIZE_INFO[size].description}
                        </option>
                      ))}
                    </select>
                  )}

                  {activeField === 'requires_inquiry' && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={requiresInquiry}
                          onChange={() => setRequiresInquiry(true)}
                          className="w-4 h-4"
                        />
                        <span>Krever forespørsel</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!requiresInquiry}
                          onChange={() => setRequiresInquiry(false)}
                          className="w-4 h-4"
                        />
                        <span>Kan kjøpes direkte</span>
                      </label>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeField && !success && (
              <div className="p-6 border-t border-border">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Oppdater {selectedProducts.length} produkt{selectedProducts.length !== 1 ? 'er' : ''}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
