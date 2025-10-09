"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/conn/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  loading,
  onClick,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'hover:shadow-lg transition-shadow cursor-pointer',
          onClick && 'hover:scale-[1.02] transition-transform'
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </p>
              {loading ? (
                <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {value}
                </p>
              )}
              {trend && !loading && (
                <div className="mt-2 flex items-center space-x-1">
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.value}%
                  </span>
                  <span className="text-sm text-gray-500">{trend.label}</span>
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                colorClasses[color]
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
