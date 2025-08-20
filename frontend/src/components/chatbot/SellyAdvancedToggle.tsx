'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { SparklesIcon, BoltIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { cn } from '@/lib/conn/utils';

interface SellyAdvancedToggleProps {
  onModeChange: (isAdvanced: boolean) => void;
  initialMode?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  disabled?: boolean;
}

/**
 * SELLY Advanced Toggle Component
 * Compact toggle for chatbox header with enterprise-grade styling
 * WCAG 2.1 AA compliant with proper focus management and keyboard support
 */
export const SellyAdvancedToggle: React.FC<SellyAdvancedToggleProps> = ({
  onModeChange,
  initialMode = false,
  className = '',
  size = 'md',
  showLabel = true,
  disabled = false,
}) => {
  const [isAdvanced, setIsAdvanced] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      switch: 'h-4 w-7',
      thumb: 'h-3 w-3',
      icon: 'h-2 w-2',
      translate: 'translate-x-3.5',
      label: 'text-xs',
    },
    md: {
      switch: 'h-5 w-9',
      thumb: 'h-3.5 w-3.5',
      icon: 'h-2.5 w-2.5',
      translate: 'translate-x-4',
      label: 'text-sm',
    },
    lg: {
      switch: 'h-6 w-11',
      thumb: 'h-4 w-4',
      icon: 'h-3 w-3',
      translate: 'translate-x-5',
      label: 'text-sm',
    },
  };

  const config = sizeConfig[size];

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('selly-advanced-mode');
    if (savedMode !== null) {
      const isAdvancedMode = savedMode === 'true';
      setIsAdvanced(isAdvancedMode);
      onModeChange(isAdvancedMode);
    }
  }, [onModeChange]);

  // Handle mode toggle with loading state
  const handleToggle = useCallback(async (enabled: boolean) => {
    if (disabled) return;

    setIsLoading(true);
    
    try {
      // Simulate brief loading for smooth UX
      await new Promise(resolve => setTimeout(resolve, 150));
      
      setIsAdvanced(enabled);
      onModeChange(enabled);

      // Save to localStorage
      localStorage.setItem('selly-advanced-mode', enabled.toString());

      console.log(`🔄 [SELLY_TOGGLE] Mode changed to: ${enabled ? 'Advanced' : 'Standard'}`);
    } catch (error) {
      console.error('❌ [SELLY_TOGGLE] Error changing mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onModeChange, disabled]);

  // Dynamic colors based on mode
  const colors = isAdvanced ? {
    bg: 'bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500',
    shadow: 'shadow-lg shadow-purple-500/25',
    glow: 'ring-2 ring-purple-500/20',
    icon: 'text-white',
    label: 'text-purple-600 dark:text-purple-400',
  } : {
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    shadow: 'shadow-md shadow-blue-500/20',
    glow: 'ring-2 ring-blue-500/20',
    icon: 'text-white',
    label: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Toggle Switch */}
      <Switch
        checked={isAdvanced}
        onChange={handleToggle}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center rounded-full transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          config.switch,
          isAdvanced
            ? cn(colors.bg, colors.shadow, "focus:ring-purple-500/50")
            : "bg-gray-300 dark:bg-gray-600 focus:ring-blue-500/50",
          isLoading && "animate-pulse"
        )}
        aria-label={`Switch to ${isAdvanced ? 'Standard' : 'Advanced'} mode`}
        aria-describedby="selly-mode-description"
      >
        <span className="sr-only">
          {isAdvanced ? 'Disable Advanced Mode' : 'Enable Advanced Mode'}
        </span>
        
        {/* Toggle Thumb */}
        <motion.span
          layout
          className={cn(
            "inline-block transform rounded-full bg-white transition-all duration-300",
            "shadow-lg ring-0 ring-white ring-opacity-60 flex items-center justify-center",
            config.thumb,
            isAdvanced ? config.translate : 'translate-x-0.5',
            isLoading && "animate-spin"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Icon inside thumb */}
          <div className="flex items-center justify-center h-full w-full">
            {isLoading ? (
              <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-500", config.icon)} />
            ) : isAdvanced ? (
              <SparklesIcon className={cn(config.icon, "text-purple-500")} />
            ) : (
              <BoltIcon className={cn(config.icon, "text-blue-500")} />
            )}
          </div>
        </motion.span>
      </Switch>

      {/* Mode Label */}
      {showLabel && (
        <div className="flex flex-col min-w-0">
          <motion.span
            key={isAdvanced ? 'advanced' : 'standard'}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "font-medium leading-tight",
              config.label,
              colors.label,
              disabled && "opacity-50"
            )}
          >
            {isAdvanced ? 'Advanced' : 'Standard'}
          </motion.span>
          <span className={cn(
            "text-xs text-muted-foreground leading-tight",
            disabled && "opacity-50"
          )}>
            {isAdvanced ? 'Enhanced AI' : 'Fast Mode'}
          </span>
        </div>
      )}

      {/* Screen reader description */}
      <span id="selly-mode-description" className="sr-only">
        {isAdvanced 
          ? 'Advanced mode provides AI-enhanced responses with personalized assistance and context-aware conversations'
          : 'Standard mode provides fast, reliable responses with local processing'
        }
      </span>
    </div>
  );
};

/**
 * Compact version for minimal space usage
 */
export const CompactSellyAdvancedToggle: React.FC<Omit<SellyAdvancedToggleProps, 'showLabel' | 'size'>> = ({
  onModeChange,
  initialMode = false,
  className = '',
  disabled = false,
}) => {
  return (
    <SellyAdvancedToggle
      onModeChange={onModeChange}
      initialMode={initialMode}
      className={className}
      size="sm"
      showLabel={false}
      disabled={disabled}
    />
  );
};

/**
 * Header version optimized for chatbox headers
 */
export const HeaderSellyAdvancedToggle: React.FC<SellyAdvancedToggleProps> = ({
  onModeChange,
  initialMode = false,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={cn(
      "flex items-center space-x-2 px-2 py-1 rounded-lg",
      "bg-background/50 backdrop-blur-sm border border-border/30",
      "hover:bg-background/70 transition-all duration-200",
      className
    )}>
      <SellyAdvancedToggle
        onModeChange={onModeChange}
        initialMode={initialMode}
        size="sm"
        showLabel={true}
        disabled={disabled}
      />
    </div>
  );
};
