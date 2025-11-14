import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Clock, Play, CheckCircle } from 'lucide-react';

interface StatItem {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'info' | 'success';
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: number;
}

const getVariantStyles = (variant?: string) => {
  switch (variant) {
    case 'warning':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
    case 'info':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'success':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }
};

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                  {stat.label}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getVariantStyles(stat.variant)}`}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
