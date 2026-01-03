'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

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

export function FilterTabs({ options, activeId, onChange, centered = false }: FilterTabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = options.findIndex(opt => opt.id === activeId);
    const activeTab = tabsRef.current[activeIndex];

    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeId, options]);

  return (
    <div className={`relative ${centered ? 'flex justify-center' : ''}`}>
      <motion.div
        className="relative inline-flex items-center gap-1 p-1.5 bg-muted rounded-full shadow-inner"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated Background Indicator */}
        <motion.div
          className="absolute h-[calc(100%-12px)] bg-primary rounded-full shadow-lg"
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

        {/* Tab Buttons */}
        {options.map((option, index) => {
          const isActive = activeId === option.id;
          return (
            <motion.button
              key={option.id}
              ref={(el) => { tabsRef.current[index] = el; }}
              onClick={() => onChange(option.id)}
              className={`relative z-10 px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                isActive
                  ? 'text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
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
