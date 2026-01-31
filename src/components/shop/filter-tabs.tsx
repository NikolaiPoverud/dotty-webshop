'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp, spring } from '@/lib/animations';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  centered?: boolean;
  groupId?: string;
}

export function FilterTabs({
  options,
  activeId,
  onChange,
  centered = false,
  groupId = 'default',
}: FilterTabsProps): React.ReactElement {
  return (
    <div className={cn('relative -mx-4 px-4 overflow-x-auto scrollbar-hide', centered && 'flex justify-center')}>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="inline-flex border border-primary sm:border-2 md:border-[3px]"
      >
        {options.map((option) => {
          const isActive = activeId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'relative px-2.5 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-xs md:px-6 md:py-3 md:text-sm font-bold uppercase tracking-wider whitespace-nowrap touch-manipulation transition-colors',
                isActive
                  ? 'bg-primary text-background'
                  : 'bg-transparent text-primary hover:bg-primary/10 active:bg-primary/20'
              )}
            >
              {/* Sliding background indicator */}
              {isActive && (
                <motion.div
                  layoutId={`filter-tab-indicator-${groupId}`}
                  className="absolute inset-0 bg-primary"
                  transition={spring}
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
