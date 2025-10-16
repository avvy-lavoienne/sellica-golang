import React, { memo } from 'react';
import { Button, Card } from 'flowbite-react';
import { HiChevronDown } from 'react-icons/hi';
import { twMerge } from 'tailwind-merge';

interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    from: number;
    to: number;
    total: number;
  };
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  onSort,
  onRowClick,
  actions,
  className
}: DataTableProps<T>) {
  return (
    <div className={twMerge('overflow-x-auto', className)}>
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={twMerge(
                  'px-6 py-3',
                  column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                )}
                onClick={() => column.sortable && onSort?.(column.key, 'asc')}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <HiChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
            ))}
            {actions && <th scope="col" className="px-6 py-3">Aksi</th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Memuat data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                Tidak ada data ditemukan
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className={twMerge(
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  onRowClick ? 'cursor-pointer' : ''
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Menampilkan {pagination.from}-{pagination.to} dari {pagination.total} hasil
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              disabled={!pagination.hasPrevious}
              onClick={pagination.onPrevious}
              color="gray"
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              disabled={!pagination.hasNext}
              onClick={pagination.onNext}
              color="gray"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  loading?: boolean;
  className?: string;
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  loading = false,
  className
}: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
  };

  return (
    <Card className={twMerge('', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          {loading ? (
            <div className="mt-1 h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
            </p>
          )}
          {change && (
            <div className="flex items-center mt-1">
              <span className={`text-sm font-medium ${
                change.trend === 'up' ? 'text-green-600' :
                change.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change.value > 0 ? '+' : ''}{change.value}% {change.label}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
});

interface ContentCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContentCard({
  title,
  subtitle,
  children,
  actions,
  variant = 'default',
  size = 'md',
  className
}: ContentCardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    bordered: 'bg-white border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-600',
    elevated: 'bg-white shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <Card className={twMerge(variantClasses[variant], sizeClasses[size], className)}>
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}

interface StatsGridProps {
  stats: Array<{
    title: string;
    value: string | number;
    change?: {
      value: number;
      label: string;
      trend: 'up' | 'down' | 'neutral';
    };
    icon?: React.ComponentType<any>;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  }>;
  loading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({
  stats,
  loading = false,
  columns = 4,
  className
}: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  };

  return (
    <div className={twMerge('grid gap-4 md:gap-6', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
          color={stat.color}
          loading={loading}
        />
      ))}
    </div>
  );
}
