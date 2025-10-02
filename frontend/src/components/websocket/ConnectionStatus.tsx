/**
 * WebSocket Connection Status Indicator
 * 
 * Displays the current WebSocket connection status with visual feedback
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStatus } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  /** Show detailed status text */
  showText?: boolean;
  /** Show icon */
  showIcon?: boolean;
  /** Compact mode (smaller) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ConnectionStatus({
  showText = true,
  showIcon = true,
  compact = false,
  className = '',
}: ConnectionStatusProps) {
  const { isConnected, statusColor, statusText, statusIcon, error } = useConnectionStatus();

  const getVariant = () => {
    if (statusColor === 'success') return 'default';
    if (statusColor === 'warning') return 'secondary';
    if (statusColor === 'destructive') return 'destructive';
    return 'outline';
  };

  return (
    <motion.div
      key={statusText}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Badge
        variant={getVariant()}
        className={`
          flex items-center gap-2
          ${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'}
          ${isConnected ? 'bg-green-500 text-white hover:bg-green-600' : ''}
        `}
        title={error ? `Error: ${error.message}` : undefined}
      >
        {showIcon && (
          <motion.span
            animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: isConnected ? Infinity : 0, repeatDelay: 2 }}
          >
            {statusIcon}
          </motion.span>
        )}
        {showText && <span>{statusText}</span>}
      </Badge>
    </motion.div>
  );
}

/**
 * Minimal connection indicator (just a dot)
 */
export function ConnectionDot({ className = '' }: { className?: string }) {
  const { isConnected } = useConnectionStatus();

  return (
    <motion.div
      className={`
        w-2 h-2 rounded-full
        ${isConnected ? 'bg-green-500' : 'bg-gray-400'}
        ${className}
      `}
      animate={isConnected ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

/**
 * Connection banner for showing connection issues
 */
export function ConnectionBanner() {
  const { isConnected, statusText, error } = useConnectionStatus();

  if (isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm"
      >
        <div className="container mx-auto flex items-center justify-center gap-2">
          <span className="font-medium">{statusText}</span>
          {error && <span className="text-xs opacity-75">({error.message})</span>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
