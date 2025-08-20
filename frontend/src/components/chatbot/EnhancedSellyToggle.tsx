/**
 * Simplified SELLY Toggle Component
 * Allows users to switch between Standard and Enhanced modes
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { SparklesIcon, BoltIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/conn/utils';

interface EnhancedSellyToggleProps {
  onModeChange: (enhanced: boolean) => void;
  initialMode?: boolean;
  className?: string;
}

/**
 * Simplified SELLY Toggle Component Implementation
 */

export const EnhancedSellyToggle: React.FC<EnhancedSellyToggleProps> = ({
  onModeChange,
  initialMode = false,
  className = ''
}) => {
  const [enhancedMode, setEnhancedMode] = useState(initialMode);

  const handleModeToggle = useCallback((enabled: boolean) => {
    setEnhancedMode(enabled);
    onModeChange(enabled);
  }, [onModeChange]);

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Mode Label */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {enhancedMode ? 'Enhanced Mode' : 'Standard Mode'}
        </span>
        <span className="text-xs text-muted-foreground">
          {enhancedMode
            ? 'AI features dengan kemampuan lengkap'
            : 'Respon cepat dan andal'
          }
        </span>
      </div>

      {/* Simple Toggle Switch */}
      <Switch
        checked={enhancedMode}
        onChange={handleModeToggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          enhancedMode
            ? 'bg-primary'
            : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <span className="sr-only">
          {enhancedMode ? 'Disable' : 'Enable'} enhanced mode
        </span>
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300",
            "shadow-sm flex items-center justify-center",
            enhancedMode ? 'translate-x-6' : 'translate-x-1'
          )}
        >
          {/* Simple icon inside toggle */}
          {enhancedMode ? (
            <SparklesIcon className="h-2.5 w-2.5 text-primary" />
          ) : (
            <BoltIcon className="h-2.5 w-2.5 text-gray-500" />
          )}
        </span>
      </Switch>
    </div>
  );
};
