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
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'relative px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-200',
                'border-2 sm:border-[3px] border-primary',
                isActive
                  ? 'text-background'
                  : 'bg-background text-primary hover:bg-primary/10'
              )}
            >
              {/* Sliding background indicator */}
              {isActive && (
                <motion.div
                  layoutId="filter-tab-indicator"
                  className="absolute inset-0 bg-primary -z-10"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
