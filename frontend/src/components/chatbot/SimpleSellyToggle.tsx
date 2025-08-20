'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { SparklesIcon, BoltIcon, CogIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { cn } from '@/lib/conn/utils';
import { Button } from '@/components/ui/button';

interface SimpleSellyToggleProps {
  onModeChange: (enhanced: boolean) => void;
  initialMode?: boolean;
  className?: string;
  showSettingsLink?: boolean;
}

/**
 * Simple SELLY Toggle Component
 * Compact toggle for chatbox header with optional settings link
 * Enterprise-grade styling with glass-morphism effects
 */
export const SimpleSellyToggle: React.FC<SimpleSellyToggleProps> = ({
  onModeChange,
  initialMode = false,
  className = '',
  showSettingsLink = true,
}) => {
  const [enhancedMode, setEnhancedMode] = useState(initialMode);

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('selly-enhanced-mode');
    if (savedMode !== null) {
      const isEnhanced = savedMode === 'true';
      setEnhancedMode(isEnhanced);
      onModeChange(isEnhanced);
    }
  }, [onModeChange]);

  // Handle mode toggle
  const handleModeToggle = useCallback((enabled: boolean) => {
    setEnhancedMode(enabled);
    onModeChange(enabled);

    // Save to localStorage
    localStorage.setItem('selly-enhanced-mode', enabled.toString());

    }, [onModeChange]);

  // Open settings page
  const openSettings = useCallback(() => {
    window.open('/selly-ai', '_blank');
  }, []);

  // Dynamic colors based on mode
  const colors = enhancedMode ? {
    primary: 'text-primary',
    accent: 'text-primary/80',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    gradient: 'bg-gradient-to-r from-primary to-primary/80',
    shadow: 'shadow-lg shadow-primary/20',
  } : {
    primary: 'text-blue-600 dark:text-blue-400',
    accent: 'text-blue-500 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200/60 dark:border-blue-700/60',
    gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    shadow: 'shadow-lg shadow-blue-500/20',
  };

  return (
    <div className={cn("flex items-center justify-between space-x-3", className)}>
      {/* Mode Toggle */}
      <div className="flex items-center space-x-3">
        {/* Mode Icon */}
        <div className={cn(
          "p-1.5 rounded-lg border transition-all duration-300",
          colors.bg,
          colors.border
        )}>
          {enhancedMode ? (
            <SparklesIcon className={cn("h-3.5 w-3.5", colors.primary)} />
          ) : (
            <BoltIcon className={cn("h-3.5 w-3.5", colors.primary)} />
          )}
        </div>

        {/* Toggle Switch */}
        <Switch
          checked={enhancedMode}
          onChange={handleModeToggle}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1",
            "shadow-inner",
            enhancedMode
              ? cn(colors.gradient, colors.shadow)
              : 'bg-gradient-to-r from-muted to-muted/80 shadow-sm'
          )}
        >
          <span className="sr-only">
            {enhancedMode ? 'Disable' : 'Enable'} enhanced mode
          </span>
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 transform rounded-full transition-all duration-300",
              "shadow-sm ring-0 ring-white ring-opacity-60 flex items-center justify-center",
              enhancedMode
                ? 'translate-x-5 bg-white shadow-primary/20'
                : 'translate-x-0.5 bg-white shadow-muted-foreground/20'
            )}
          >
            {/* Mini icon inside toggle */}
            <div className="flex items-center justify-center h-full w-full">
              {enhancedMode ? (
                <SparklesIcon className="h-2 w-2 text-primary" />
              ) : (
                <BoltIcon className="h-2 w-2 text-blue-500" />
              )}
            </div>
          </span>
        </Switch>

        {/* Mode Label */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {enhancedMode ? 'Advanced' : 'Standard'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {enhancedMode ? 'Enhanced AI' : 'Fast Mode'}
          </span>
        </div>
      </div>

      {/* Settings Link */}
      {showSettingsLink && (
        <Button
          variant="ghost"
          size="sm"
          onClick={openSettings}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
          aria-label="Open SELLY Settings"
          title="Advanced Settings"
        >
          <CogIcon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

/**
 * Compact version for minimal space usage
 */
export const CompactSellyToggle: React.FC<Omit<SimpleSellyToggleProps, 'showSettingsLink'>> = ({
  onModeChange,
  initialMode = false,
  className = '',
}) => {
  const [enhancedMode, setEnhancedMode] = useState(initialMode);

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('selly-enhanced-mode');
    if (savedMode !== null) {
      const isEnhanced = savedMode === 'true';
      setEnhancedMode(isEnhanced);
      onModeChange(isEnhanced);
    }
  }, [onModeChange]);

  // Handle mode toggle
  const handleModeToggle = useCallback((enabled: boolean) => {
    setEnhancedMode(enabled);
    onModeChange(enabled);
    localStorage.setItem('selly-enhanced-mode', enabled.toString());
  }, [onModeChange]);

  // Dynamic colors
  const colors = enhancedMode ? {
    gradient: 'bg-gradient-to-r from-primary to-primary/80',
    shadow: 'shadow-sm shadow-primary/20',
  } : {
    gradient: 'bg-gradient-to-r from-muted to-muted/80',
    shadow: 'shadow-sm',
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Switch
        checked={enhancedMode}
        onChange={handleModeToggle}
        className={cn(
          "relative inline-flex h-4 w-7 items-center rounded-full transition-all duration-300",
          "focus:outline-none focus:ring-1 focus:ring-primary/50",
          colors.gradient,
          colors.shadow
        )}
      >
        <span className="sr-only">Toggle enhanced mode</span>
        <span
          className={cn(
            "inline-block h-3 w-3 transform rounded-full transition-transform duration-300",
            "bg-white shadow-sm",
            enhancedMode ? 'translate-x-3.5' : 'translate-x-0.5'
          )}
        />
      </Switch>
      <span className="text-xs font-medium text-muted-foreground">
        {enhancedMode ? 'Enhanced' : 'Standard'}
      </span>
    </div>
  );
};
