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
    <div className={cn('relative', centered && 'flex justify-center')}>
      <motion.div
        className="relative inline-flex items-center gap-1 bg-background border-[3px] border-primary p-1 shadow-[4px_4px_0_0_theme(colors.primary)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute h-[calc(100%-8px)] bg-primary"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />

        {options.map((option, index) => (
          <motion.button
            key={option.id}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative z-10 px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200',
              activeId === option.id
                ? 'text-background'
                : 'text-muted-foreground hover:text-primary'
            )}
            whileTap={{ scale: 0.97 }}
          >
            {option.label}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
