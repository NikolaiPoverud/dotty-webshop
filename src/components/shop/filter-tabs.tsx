'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  centered?: boolean;
}

export function FilterTabs({ options, activeId, onChange, centered = false }: FilterTabsProps): React.ReactElement {
  return (
    <div className={cn('relative -mx-4 px-4 overflow-x-auto scrollbar-hide', centered && 'flex justify-center')}>
      <motion.div
        className="inline-flex items-center gap-2 sm:gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {options.map((option) => {
          const isActive = activeId === option.id;

          return (
            <motion.button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'relative px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200',
                isActive
                  ? 'bg-primary text-background border-2 border-primary shadow-[3px_3px_0_0_theme(colors.foreground)]'
                  : 'bg-background text-muted-foreground border-2 border-muted hover:border-primary hover:text-primary'
              )}
              whileHover={!isActive ? { y: -2 } : undefined}
              whileTap={{ scale: 0.97 }}
            >
              {option.label}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
