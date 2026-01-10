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
        className="relative inline-flex items-center gap-1 rounded-full bg-muted p-1.5 shadow-inner"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute h-[calc(100%-12px)] rounded-full bg-primary shadow-lg"
          style={{ boxShadow: '0 4px 14px rgba(254, 32, 106, 0.4)' }}
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
              'relative z-10 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300',
              activeId === option.id
                ? 'text-background'
                : 'text-muted-foreground hover:text-foreground'
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
