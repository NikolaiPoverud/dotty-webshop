'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Ruler, Loader2, Check } from 'lucide-react';
import type { ProductSize } from '@/types';

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

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

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

    const exists = value.some((s) => s.width === w && s.height === h);
    if (exists) return;

    const newSizes = [...value, { width: w, height: h, label: `${w}x${h} cm` }];
    onChange(newSizes);
    setWidth('');
    setHeight('');

    await triggerAutoSave(newSizes);
  }

  async function removeSize(index: number): Promise<void> {
    const newSizes = value.filter((_, i) => i !== index);
    onChange(newSizes);
    await triggerAutoSave(newSizes);
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
              <motion.span
                key={`${size.width}x${size.height}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-sm"
              >
                <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                {size.label}
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="ml-1 p-0.5 hover:bg-error/20 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
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
            className={INPUT_CLASS}
          />
          <span className="text-muted-foreground">x</span>
          <input
            type="number"
            placeholder="Hoyde"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            className={INPUT_CLASS}
          />
          <span className="text-muted-foreground text-sm">cm</span>
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
          Legg til tilgjengelige storrelser for kunstverket (bredde x hoyde i cm)
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
