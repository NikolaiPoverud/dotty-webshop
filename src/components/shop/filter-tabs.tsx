'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = options.findIndex((opt) => opt.id === activeId);
    const activeTab = tabsRef.current[activeIndex];

    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeId, options]);

  return (
    <div className={cn('relative -mx-4 px-4 overflow-x-auto scrollbar-hide', centered && 'flex justify-center')}>
      <motion.div
        className="relative inline-flex items-center gap-0.5 bg-muted/50 rounded-full p-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Sliding pill indicator */}
        <motion.div
          className="absolute h-[calc(100%-8px)] bg-primary/90 rounded-full"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 30,
          }}
        />

        {options.map((option, index) => (
          <button
            key={option.id}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative z-10 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium uppercase tracking-wide transition-colors duration-200 whitespace-nowrap rounded-full',
              activeId === option.id
                ? 'text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
