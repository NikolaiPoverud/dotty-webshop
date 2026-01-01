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
      <div className="relative inline-flex items-center gap-1 p-1 bg-muted rounded-full">
        {/* Animated Background Indicator */}
        <motion.div
          className="absolute h-[calc(100%-8px)] bg-primary rounded-full"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 35,
          }}
        />

        {/* Tab Buttons */}
        {options.map((option, index) => (
          <button
            key={option.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            onClick={() => onChange(option.id)}
            className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
              activeId === option.id
                ? 'text-background'
                : 'text-foreground hover:text-foreground/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
