'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Ruler, Loader2, Check, Pencil } from 'lucide-react';
import type { ProductSize } from '@/types';
import { formatPrice } from '@/lib/utils';

interface SizeInputProps {
  value: ProductSize[];
  onChange: (sizes: ProductSize[]) => void;
  onAutoSave?: (sizes: ProductSize[]) => Promise<void>;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function SizeInput({ value, onChange, onAutoSave }: SizeInputProps): React.ReactElement {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [price, setPrice] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');

  async function triggerAutoSave(newSizes: ProductSize[]): Promise<void> {
    if (!onAutoSave) return;

    setSaveStatus('saving');
    try {
      await onAutoSave(newSizes);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  async function addSize(): Promise<void> {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    const p = price ? parseInt(price, 10) * 100 : undefined; // Convert kr to øre

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

    const exists = value.some((s) => s.width === w && s.height === h);
    if (exists) return;

    const newSize: ProductSize = {
      width: w,
      height: h,
      label: `${w}x${h} cm`,
      ...(p && { price: p })
    };
    const newSizes = [...value, newSize];
    onChange(newSizes);
    setWidth('');
    setHeight('');
    setPrice('');

    await triggerAutoSave(newSizes);
  }

  async function removeSize(index: number): Promise<void> {
    const newSizes = value.filter((_, i) => i !== index);
    onChange(newSizes);
    await triggerAutoSave(newSizes);
  }

  function startEditing(index: number): void {
    setEditingIndex(index);
    const currentPrice = value[index].price;
    setEditPrice(currentPrice ? String(currentPrice / 100) : '');
  }

  async function saveEditedPrice(): Promise<void> {
    if (editingIndex === null) return;

    const newPrice = editPrice ? parseInt(editPrice, 10) * 100 : undefined;
    const newSizes = value.map((size, i) => {
      if (i === editingIndex) {
        const { price: _, ...sizeWithoutPrice } = size;
        return newPrice ? { ...sizeWithoutPrice, price: newPrice } : sizeWithoutPrice;
      }
      return size;
    });

    onChange(newSizes);
    setEditingIndex(null);
    setEditPrice('');
    await triggerAutoSave(newSizes);
  }

  function cancelEditing(): void {
    setEditingIndex(null);
    setEditPrice('');
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSize();
    }
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {value.map((size, index) => (
              <motion.div
                key={`${size.width}x${size.height}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm"
              >
                {editingIndex === index ? (
                  <>
                    <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{size.label}</span>
                    <input
                      type="number"
                      placeholder="Pris"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveEditedPrice();
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      autoFocus
                      min="0"
                      className="w-20 px-2 py-1 bg-background border border-primary rounded text-sm"
                    />
                    <span className="text-muted-foreground text-xs">kr</span>
                    <button
                      type="button"
                      onClick={saveEditedPrice}
                      className="p-0.5 hover:bg-success/20 rounded transition-colors text-success"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="p-0.5 hover:bg-error/20 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                    {size.label}
                    {size.price ? (
                      <span className="text-primary font-medium">
                        {formatPrice(size.price)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">(produktpris)</span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(index)}
                      className="ml-1 p-0.5 hover:bg-primary/20 rounded transition-colors text-muted-foreground hover:text-primary"
                      title="Rediger pris"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="p-0.5 hover:bg-error/20 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="number"
            placeholder="Bredde"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            className={`${INPUT_CLASS} max-w-20`}
          />
          <span className="text-muted-foreground">x</span>
          <input
            type="number"
            placeholder="Hoyde"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            className={`${INPUT_CLASS} max-w-20`}
          />
          <span className="text-muted-foreground text-sm">cm</span>
          <input
            type="number"
            placeholder="Pris (valgfritt)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            min="0"
            className={`${INPUT_CLASS} max-w-28`}
          />
          <span className="text-muted-foreground text-sm">kr</span>
        </div>
        <button
          type="button"
          onClick={addSize}
          disabled={!width || !height}
          className="p-2 bg-primary text-background rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Legg til storrelser (bredde x hoyde i cm). Pris er valgfritt - bruker produktpris hvis tom.
        </p>
        <AnimatePresence mode="wait">
          {saveStatus === 'saving' && (
            <motion.span
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Lagrer...
            </motion.span>
          )}
          {saveStatus === 'saved' && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-success"
            >
              <Check className="w-3 h-3" />
              Lagret
            </motion.span>
          )}
          {saveStatus === 'error' && (
            <motion.span
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-error"
            >
              Kunne ikke lagre
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
