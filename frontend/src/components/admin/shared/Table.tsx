import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey?: string;
}

export function Table({ columns, data, isLoading, emptyMessage = 'Tidak ada data', rowKey = 'id' }: TableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 ${column.width || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row[rowKey] || rowIndex} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              {columns.map((column) => (
                <td key={`${row[rowKey]}-${column.key}`} className={`px-4 py-3 ${column.width || ''}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ActionCellProps {
  actions: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
    isLoading?: boolean;
  }[];
}

export function ActionCell({ actions }: ActionCellProps) {
  return (
    <div className="flex space-x-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'default'}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled || action.isLoading}
        >
          {action.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : null}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
