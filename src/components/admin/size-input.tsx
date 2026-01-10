'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Ruler } from 'lucide-react';
import type { ProductSize } from '@/types';

interface SizeInputProps {
  value: ProductSize[];
  onChange: (sizes: ProductSize[]) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm';

export function SizeInput({ value, onChange }: SizeInputProps): React.ReactElement {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  function addSize(): void {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

    const exists = value.some((s) => s.width === w && s.height === h);
    if (exists) return;

    onChange([...value, { width: w, height: h, label: `${w}x${h} cm` }]);
    setWidth('');
    setHeight('');
  }

  function removeSize(index: number): void {
    onChange(value.filter((_, i) => i !== index));
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

      <p className="text-xs text-muted-foreground">
        Legg til tilgjengelige storrelser for kunstverket (bredde x hoyde i cm)
      </p>
    </div>
  );
}
