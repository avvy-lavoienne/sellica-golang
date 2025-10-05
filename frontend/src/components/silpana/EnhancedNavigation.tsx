'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEnhancedNavigation } from '@/hooks/useEnhancedNavigation';
import { SilpanaMode } from '@/types/silpana/silpana';
import { cn } from '@/lib/utils';

interface EnhancedNavigationProps {
  className?: string;
  variant?: 'default' | 'compact' | 'mobile';
  showKeyboardHints?: boolean;
  allowedModes?: SilpanaMode[]; // Restrict available modes for guest vs admin
  onModeChange?: (mode: SilpanaMode) => void;
}

const tabVariants: Variants = {
  inactive: {
    scale: 0.95,
    opacity: 0.7,
    y: 0
  },
  active: {
    scale: 1,
    opacity: 1,
    y: -2,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 30
    }
  },
  hover: {
    scale: 1.02,
    y: -1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25
    }
  }
};

const glowVariants: Variants = {
  inactive: {
    boxShadow: '0 0 0 rgba(59, 130, 246, 0)'
  },
  active: {
    boxShadow: [
      '0 0 20px rgba(59, 130, 246, 0.3)',
      '0 0 30px rgba(59, 130, 246, 0.2)',
      '0 0 20px rgba(59, 130, 246, 0.3)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse' as const
    }
  }
};

export default function EnhancedNavigation({
  className,
  variant = 'default',
  showKeyboardHints = true,
  allowedModes,
  onModeChange
}: EnhancedNavigationProps) {
  const {
    tabs,
    currentMode,
    navigateToMode,
    isTransitioning,
    transitionDirection,
    canNavigate
  } = useEnhancedNavigation({
    enableKeyboardShortcuts: true,
    enableUrlSync: true,
    allowedModes,
    onModeChange
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    const activeButton = containerRef.current?.querySelector(`[data-mode="${currentMode}"]`);
    if (activeButton && document.activeElement !== activeButton) {
      (activeButton as HTMLElement).focus();
    }
  }, [currentMode]);

  const handleTabClick = (mode: SilpanaMode) => {
    if (canNavigate(mode)) {
      navigateToMode(mode);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, mode: SilpanaMode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(mode);
    }
  };

  const getTabStyles = (tabId: SilpanaMode, isActive: boolean) => {
    const baseStyles = cn(
      'relative group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300',
      'border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        // Default variant
        'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300': 
          variant === 'default' && !isActive,
        'bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700': 
          variant === 'default' && isActive,
        
        // Compact variant
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600': 
          variant === 'compact' && !isActive,
        'bg-blue-500 text-white shadow-md': 
          variant === 'compact' && isActive,
        
        // Mobile variant
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300': 
          variant === 'mobile' && !isActive,
        'bg-blue-600 text-white border-blue-600': 
          variant === 'mobile' && isActive,
      }
    );

    return baseStyles;
  };

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className={cn(
          'flex gap-2 justify-center',
          {
            'flex-wrap': variant === 'mobile',
            'flex-nowrap': variant !== 'mobile'
          },
          className
        )}
        role="tablist"
        aria-label="Navigation tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.isActive;
          const isDisabled = tab.isDisabled || !canNavigate(tab.id);

          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <motion.div
                  variants={tabVariants}
                  animate={isActive ? 'active' : 'inactive'}
                  whileHover={!isDisabled ? 'hover' : 'inactive'}
                  className="relative"
                >
                  {/* Glow effect for active tab */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      variants={glowVariants}
                      animate="active"
                      initial="inactive"
                    />
                  )}
                  
                  <Button
                    variant="ghost"
                    size={variant === 'compact' ? 'sm' : 'default'}
                    className={getTabStyles(tab.id, isActive)}
                    onClick={() => handleTabClick(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, tab.id)}
                    disabled={isDisabled}
                    data-mode={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {/* Icon */}
                    <span 
                      className="text-lg"
                      role="img"
                      aria-hidden="true"
                    >
                      {tab.icon}
                    </span>
                    
                    {/* Label */}
                    {variant !== 'compact' && (
                      <span className="truncate">
                        {tab.label}
                      </span>
                    )}
                    
                    {/* Keyboard shortcut hint */}
                    {showKeyboardHints && tab.keyboardShortcut && !isActive && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 text-xs px-1.5 py-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        Ctrl+Shift+{tab.keyboardShortcut}
                      </Badge>
                    )}
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 w-8 h-0.5 bg-white rounded-full"
                        layoutId="activeIndicator"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30
                        }}
                        style={{ x: '-50%' }}
                      />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              
              <TooltipContent 
                side="bottom" 
                align="center"
                className="z-50 max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-700 dark:bg-gray-800"
                sideOffset={8}
                collisionPadding={10}
                avoidCollisions={true}
              >
                <div className="space-y-2 p-3">
                  {/* Title with icon */}
                  <div className="flex items-center gap-2">
                    {tab.icon && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-lg dark:bg-blue-900/30">
                        {tab.icon}
                      </div>
                    )}
                    <p className="font-semibold text-gray-900 dark:text-white">{tab.label}</p>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {tab.description}
                  </p>
                  
                  {/* Keyboard shortcut badge */}
                  {showKeyboardHints && tab.keyboardShortcut && (
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                      <kbd className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 dark:bg-gray-800 dark:text-white dark:ring-gray-600">
                        Ctrl
                      </kbd>
                      <span className="text-xs text-gray-500 dark:text-gray-400">+</span>
                      <kbd className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 dark:bg-gray-800 dark:text-white dark:ring-gray-600">
                        Shift
                      </kbd>
                      <span className="text-xs text-gray-500 dark:text-gray-400">+</span>
                      <kbd className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 dark:bg-gray-800 dark:text-white dark:ring-gray-600">
                        {tab.keyboardShortcut}
                      </kbd>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {/* Transition indicator */}
        {isTransitioning && (
          <motion.div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}