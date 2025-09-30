/**
 * Enhanced Status Badge Component
 * Features: WCAG AAA compliance, animations, tooltips
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/design-system/colors';
import { typo } from '@/lib/design-system/typography';
import { animations } from '@/lib/design-system/layout';
import type { TicketStatus, PriorityLevel } from '@/types/silpana/silpana';

interface EnhancedStatusBadgeProps {
  status: TicketStatus;
  priority?: PriorityLevel;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
  showTooltip?: boolean;
  animate?: boolean;
  className?: string;
}

// Status configurations with Indonesian labels
const statusConfig: Record<TicketStatus, {
  label: string;
  description: string;
  icon: string;
  className: string;
  dotColor: string;
}> = {
  submitted: {
    label: 'Diajukan',
    description: 'Pengaduan telah diterima dan menunggu peninjauan',
    icon: '📝',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-500'
  },
  under_review: {
    label: 'Ditinjau',
    description: 'Pengaduan sedang dalam proses peninjauan tim',
    icon: '👀',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500'
  },
  in_progress: {
    label: 'Diproses',
    description: 'Pengaduan sedang dalam proses penyelesaian',
    icon: '⚙️',
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    dotColor: 'bg-purple-500'
  },
  pending_info: {
    label: 'Butuh Info',
    description: 'Menunggu informasi tambahan dari pengadu',
    icon: '❓',
    className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    dotColor: 'bg-orange-500'
  },
  escalated: {
    label: 'Dieskalasi',
    description: 'Pengaduan telah dieskalasi ke tingkat yang lebih tinggi',
    icon: '⬆️',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    dotColor: 'bg-red-500'
  },
  resolved: {
    label: 'Selesai',
    description: 'Pengaduan telah diselesaikan',
    icon: '✅',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    dotColor: 'bg-green-500'
  },
  closed: {
    label: 'Ditutup',
    description: 'Pengaduan telah ditutup',
    icon: '🔒',
    className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
    dotColor: 'bg-gray-500'
  },
  rejected: {
    label: 'Ditolak',
    description: 'Pengaduan tidak dapat diproses',
    icon: '❌',
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
    dotColor: 'bg-red-600'
  }
};

// Priority configurations
const priorityConfig: Record<PriorityLevel, {
  label: string;
  className: string;
}> = {
  low: {
    label: 'Rendah',
    className: 'bg-gray-100 text-gray-600 border-gray-200'
  },
  medium: {
    label: 'Sedang', 
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  high: {
    label: 'Tinggi',
    className: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  critical: {
    label: 'Kritis',
    className: 'bg-red-100 text-red-800 border-red-300'
  }
};

const EnhancedStatusBadge: React.FC<EnhancedStatusBadgeProps> = ({
  status,
  priority,
  size = 'md',
  variant = 'solid',
  showTooltip = true,
  animate = true,
  className
}) => {
  const config = statusConfig[status];
  const priorityConf = priority ? priorityConfig[priority] : null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const badgeContent = (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.8 } : false}
      animate={animate ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        sizeClasses[size],
        config.className,
        animations.transition.default,
        'hover:scale-105 active:scale-95',
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {/* Status indicator dot */}
      <motion.div
        className={cn('w-2 h-2 rounded-full', config.dotColor)}
        animate={animate && status === 'in_progress' ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        } : false}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* Status text */}
      <span className={typo.ui.label(size === 'lg' ? 'lg' : 'sm')}>
        {config.label}
      </span>

      {/* Priority indicator (if provided) */}
      {priority && (
        <>
          <span className="text-current opacity-30">•</span>
          <span className={cn(
            'text-xs font-medium',
            priorityConf?.className.split(' ').filter(cls => cls.startsWith('text-'))[0]
          )}>
            {priorityConf?.label}
          </span>
        </>
      )}
    </motion.div>
  );

  if (!showTooltip) return badgeContent;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3"
          sideOffset={8}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span>{config.icon}</span>
              <span className="font-medium">{config.label}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {config.description}
            </p>
            {priority && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Prioritas: <span className="font-medium">{priorityConf?.label}</span>
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EnhancedStatusBadge;