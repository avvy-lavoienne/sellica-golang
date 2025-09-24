/**
 * Enhanced Page Header Component
 * Features: Progressive disclosure, breadcrumbs, actions, accessibility
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { typo, textColors } from '@/lib/design-system/typography';
import { layout, animations } from '@/lib/design-system/layout';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface HeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: HeaderAction[];
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'outline' | 'success' | 'destructive';
  }>;
  stats?: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  className?: string;
  animate?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  breadcrumbs = [],
  actions = [],
  badges = [],
  stats = [],
  className,
  animate = true
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1] as const,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0.0, 0.2, 1] as const
      }
    }
  };

  return (
    <motion.header
      variants={animate ? containerVariants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
      className={cn(
        'space-y-6 pb-6 border-b border-gray-200 dark:border-gray-800',
        className
      )}
      role="banner"
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <motion.nav
          variants={animate ? itemVariants : undefined}
          className="flex items-center space-x-2 text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className={cn(
              'flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              animations.transition.colors
            )}
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
          
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
              {item.current || !item.href ? (
                <span 
                  className={cn(
                    textColors.primary,
                    'font-medium'
                  )}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    animations.transition.colors
                  )}
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </motion.nav>
      )}

      {/* Main Header Content */}
      <div className={layout.flex.between}>
        <motion.div 
          variants={animate ? itemVariants : undefined}
          className="space-y-4 flex-1 min-w-0"
        >
          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={typo.heading(1, textColors.primary)}>
                {title}
              </h1>
              
              {/* Badges */}
              {badges.map((badge, index) => (
                <Badge 
                  key={index}
                  variant={badge.variant || 'default'}
                  className="shrink-0"
                >
                  {badge.label}
                </Badge>
              ))}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className={typo.body('lg', cn(textColors.secondary, 'font-medium'))}>
                {subtitle}
              </p>
            )}

            {/* Description */}
            {description && (
              <p className={typo.body('md', cn(textColors.tertiary, 'max-w-4xl'))}>
                {description}
              </p>
            )}
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex items-center gap-6 pt-2">
              {stats.map((stat, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={typo.heading(4, textColors.primary)}>
                        {stat.value}
                      </span>
                      {stat.change && (
                        <span className={cn(
                          typo.body('sm'),
                          stat.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                          stat.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-500 dark:text-gray-400'
                        )}>
                          {stat.change}
                        </span>
                      )}
                    </div>
                    <span className={typo.body('sm', textColors.tertiary)}>
                      {stat.label}
                    </span>
                  </div>
                  {index < stats.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        {actions.length > 0 && (
          <motion.div 
            variants={animate ? itemVariants : undefined}
            className="flex items-center gap-3 ml-4"
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size={action.size || 'default'}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  animations.transition.default,
                  'hover:scale-105 active:scale-95'
                )}
              >
                {action.icon && (
                  <span className="mr-2" aria-hidden="true">
                    {action.icon}
                  </span>
                )}
                {action.label}
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default PageHeader;