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
          'flex gap-2',
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
                className="max-w-xs text-center"
                sideOffset={8}
              >
                <div className="space-y-1">
                  <p className="font-medium">{tab.label}</p>
                  <p className="text-xs text-muted-foreground">{tab.description}</p>
                  {showKeyboardHints && tab.keyboardShortcut && (
                    <p className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                      Ctrl+Shift+{tab.keyboardShortcut}
                    </p>
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